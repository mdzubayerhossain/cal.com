import { useCallback, useState } from "react";
import { sdkActionManager } from "@calcom/embed-core/embed-iframe";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { useRefreshData } from "@calcom/lib/hooks/useRefreshData";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@calcom/lib/telemetry";
import type { RecurringEvent } from "@calcom/types/Calendar";
import { Button, Icon, TextArea } from "@calcom/ui";

type Props = {
  booking: {
    title?: string;
    uid?: string;
    id?: number;
  };
  profile: {
    name: string | null;
    slug: string | null;
  };
  recurringEvent: RecurringEvent | null;
  team?: string | null;
  setIsCancellationMode: (value: boolean) => void;
  theme: string | null;
  allRemainingBookings: boolean;
  seatReferenceUid?: string;
  currentUserEmail?: string;
  bookingCancelledEventProps: {
    booking: unknown;
    organizer: {
      name: string;
      email: string;
      timeZone?: string;
    };
    eventType: unknown;
  };
};

export default function CancelBooking(props: Props) {
  const {
    booking,
    allRemainingBookings,
    setIsCancellationMode,
    seatReferenceUid,
    bookingCancelledEventProps,
    currentUserEmail,
  } = props;

  const [cancellationReason, setCancellationReason] = useState<string>("");
  const { t } = useLocale();
  const refreshData = useRefreshData();
  const telemetry = useTelemetry();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(booking ? null : t("booking_already_cancelled"));

  const cancelBookingRef = useCallback((node: HTMLTextAreaElement) => {
    if (node !== null) {
      node.scrollIntoView({ behavior: "smooth" });
      node.focus();
    }
  }, []);

  const handleCancellation = async () => {
    setLoading(true);
    try {
      telemetry.event(telemetryEventTypes.bookingCancelled, collectPageParameters());

      const res = await fetch("/api/cancel", {
        body: JSON.stringify({
          uid: booking?.uid,
          cancellationReason,
          allRemainingBookings,
          seatReferenceUid,
          cancelledBy: currentUserEmail,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(`${t("error_with_status_code_occured", { status: res.status })}`);
      }

      const bookingWithCancellationReason = {
        ...(bookingCancelledEventProps.booking as object),
        cancellationReason,
      } as unknown;

      sdkActionManager?.fire("bookingCancelled", {
        ...bookingCancelledEventProps,
        booking: bookingWithCancellationReason,
      });
      refreshData();
    } catch (error) {
      setError(error.message || t("please_try_again"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error ? (
        <div className="mt-8">
          <div className="bg-error mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            <Icon name="x" className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-emphasis text-lg font-medium leading-6" id="modal-title">
              {error}
            </h3>
          </div>
        </div>
      ) : (
        <div className="mt-5 sm:mt-6">
          <label htmlFor="cancellationReason" className="text-default font-medium">
            {t("cancellation_reason")}
          </label>
          <TextArea
            id="cancellationReason"
            data-testid="cancel_reason"
            ref={cancelBookingRef}
            placeholder={t("cancellation_reason_placeholder")}
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            className="mb-4 mt-2 w-full"
            rows={3}
          />
          <div className="flex flex-col-reverse rtl:space-x-reverse">
            <div className="ml-auto flex w-full space-x-4">
              <Button
                aria-label="Cancel and go back"
                color="secondary"
                onClick={() => setIsCancellationMode(false)}
              >
                {t("nevermind")}
              </Button>
              <Button
                aria-label="Confirm cancellation"
                data-testid="confirm_cancel"
                disabled={loading}
                onClick={handleCancellation}
                loading={loading}
              >
                {allRemainingBookings ? t("cancel_all_remaining") : t("cancel_event")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

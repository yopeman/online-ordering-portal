import { Mail, MailOpen } from "lucide-react";

import { setOrderReadAction } from "@/app/actions/orders";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import type { OrderListItem } from "@/lib/queries";

export async function OrderReadToggle({
  orderId,
  isRead,
}: {
  orderId: string;
  isRead: boolean;
}) {
  const t = await getTranslator();

  return (
    <form action={setOrderReadAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="isRead" value={String(!isRead)} />
      <button
        type="submit"
        title={isRead ? t("common.markAsUnread") : t("common.markAsRead")}
        aria-label={isRead ? t("common.markAsUnread") : t("common.markAsRead")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        {isRead ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
      </button>
    </form>
  );
}

export async function OrderList({ orders }: { orders: OrderListItem[] }) {
  const t = await getTranslator();
  const { price, date } = await getFormatters();

  return (
    <ul className="divide-y divide-border">
      {orders.map((order) => {
        const details = order.details ?? {};
        const quantity = Number(details.quantity ?? 1) || 1;
        const total =
          typeof details.total === "number" ? details.total : order.productPrice * quantity;
        const currency =
          typeof details.currency === "string" ? details.currency : order.productCurrency;

        return (
          <li
            key={order.id}
            className={`flex flex-wrap items-start gap-3 px-4 py-3 ${
              order.isRead ? "" : "bg-primary-soft/40"
            }`}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{order.productName}</p>
                <span className="text-xs text-muted-foreground">×{quantity}</span>
                {!order.isRead ? (
                  <span className="text-xs font-medium text-primary">
                    {t("common.unread")}
                  </span>
                ) : null}
              </div>

              <p className="text-sm text-muted-foreground">
                {t("orders.customer")}:{" "}
                <span className="text-foreground">
                  {String(details.customerName ?? t("orders.unknownCustomer"))}
                </span>
                {details.phone ? (
                  <>
                    {" · "}
                    <a
                      href={`tel:${String(details.phone)}`}
                      className="text-primary hover:underline"
                    >
                      {String(details.phone)}
                    </a>
                  </>
                ) : null}
                {details.email ? ` · ${String(details.email)}` : null}
              </p>

              {details.note ? (
                <p className="text-sm text-muted-foreground">
                  {t("common.note")}: {String(details.note)}
                </p>
              ) : null}

              {details.custom && Object.keys(details.custom as object).length > 0 ? (
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {Object.entries(details.custom as Record<string, string>).map(
                    ([key, value]) => (
                      <li key={key}>
                        <span className="font-medium text-foreground">{key}:</span>{" "}
                        {value || "—"}
                      </li>
                    ),
                  )}
                </ul>
              ) : null}

              <p className="text-xs text-muted-foreground">
                {t("orders.orderedOn")}: {date(order.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">
                {price(total, currency)}
              </span>
              <OrderReadToggle orderId={order.id} isRead={order.isRead} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
import { DynamicNotifications } from "@/components/features/notifications/DynamicIsland";
import { NotificationCenterProvider } from "@/components/features/notifications/NotificationCenter";

/**
 * messages/[id] opt-out layout.
 *
 * The chat page is a full-viewport h-screen layout with its own
 * sticky header. Opting out of AppShell here so the sidebar
 * grid does not conflict with the chat's flex column structure.
 *
 * The notification island is mounted anyway, and this is the page that most
 * needs it: nothing here refreshes on its own, so without it a message that
 * arrives while the thread is open is invisible until somebody reloads. The
 * island is `position: fixed` and absolute about its own placement, so it needs
 * none of the shell that is being opted out of. Tapping it reloads the thread as
 * a side effect of navigating to it, which is what surfaces the message.
 */
export default function MessageThreadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
      `--nav-height` is re-declared because this page's bar is not the app's:
      the chat header is 70px where `.app-nav` is 56px, and the island's chip
      centres itself inside `--nav-height` so that it sits in the bar rather than
      near it. Left at the token's value the chip would float 7px high in a
      header it is supposed to belong to. The property inherits into the fixed
      layer the island renders, which is why the declaration lives on a wrapper
      and not on the layer itself.
    */
    <div style={{ "--nav-height": "70px" } as React.CSSProperties}>
      <NotificationCenterProvider>
        <DynamicNotifications />
        {children}
      </NotificationCenterProvider>
    </div>
  );
}

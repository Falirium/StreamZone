# User Story Specification: World A Platform (Morocco MVP)

This document serves as the operational blueprint for the StreamZone World A payment and playback workflow. It maps normal paths and edge cases to ensure a robust user and administrator experience.

---

## MODULE 1: The First-Time Landing & Pricing Flow

### Normal Path: Dynamic Local Pricing & WhatsApp Routing
* **User Actions:** An unauthenticated visitor lands on the homepage. They see a prompt showing live/upcoming World Cup matches and click "View Pricing". The page reads their location/context, renders the pricing options dynamically in Moroccan Dirham (MAD), and highlights local payment notes (e.g., CashPlus, bank transfer details).
* **Selection:** The user selects the "Match Pass" plan and clicks the primary CTA.
* **Routing:** The backend queries the active operator pool assigned to Morocco, executes a load-weighted random selection, and returns the chosen operator.
* **Outcome:** The user is redirected to WhatsApp with a prefilled message: 
  `Hi! I would like to pay for Match Pass (10.00 MAD). Reference ID: TXN-ABCD1234.`

### Edge Case: Unsupported Country or Masked IP/Network
* **Behavior:** A user visits from a country with no local currency configured (e.g., Japan) or behind a VPN/proxy that masks their IP.
* **System Resolution:**
  1. The pricing engine detects a missing or unmapped country code.
  2. The page falls back to a global default country configuration (e.g., USD base currency).
  3. The payment page checks for WhatsApp operators. Because no country-specific operators are assigned, it routes the traffic to operators marked as **Global Fallbacks** (no assignments).
  4. The pricing table remains fully functional, displaying standard rates and directing users to a general admin agent with a generic English payment request template.

---

## MODULE 2: The Frictionless Code Redemption Overlay

### Normal Path: Code Redemption & Activation
* **User Actions:** The authenticated user navigates to the watch page or clicks "Watch Live Now" on a match. A mobile-friendly sliding bottom drawer appears prompting them to enter their access pass code.
* **Input:** The user types or pastes their 8-character code (`XXXX-XXXX`) and clicks "Unlock Access".
* **System Action:** A database transaction is executed:
  1. The access code status is validated (`available` or `assigned` to this user's phone).
  2. A new `AccessEntitlement` is created mapping the user ID to the plan/event.
  3. A `Redemption` record is created linking the code.
  4. The code status is updated to `redeemed`.
* **UX Feedback:** The modal displays a green checkmark success state with a smooth slide-and-zoom animation, automatically routing the user to the active stream within 2 seconds.

### Edge Case: Device Limit Reached (`max_devices` Limit)
* **Context:** The code is valid and active, but the plan associated with the code restricts simultaneous streams, and the user has already opened the stream on other devices.
* **UX Feedback:**
  * The input field highlights in yellow/amber.
  * An inline warning banner displays: 
    `"Device Limit Reached. This pass is currently active on [N] other screens. Please close the stream on your other devices to watch here, or contact support on WhatsApp to upgrade your pass."`
  * Prevents rendering the video player on the current device without logging out the other sessions.

### Edge Case: Expired, Invalid, or Typo Code
* **Behavior:** The user enters a code with a typo, or a code that has expired or was revoked by an admin.
* **System Resolution:**
  * The server action catches the validation error.
  * Instead of crashing the overlay or refreshing the page, the error is returned inline:
    * Typo/Format error: `"Code must be exactly 8 characters (e.g., ABCD-1234)."`
    * Invalid/Expired error: `"Invalid access code. Please verify the characters or contact your payment agent."`
  * The input field remains active, highlighted in red, allowing immediate correction.

---

## MODULE 3: The Match-Day Video Experience

### Normal Path: HLS Stream Playback
* **UX Experience:** The user enters their watch page. The player resolves the HLS stream URL (`.m3u8`) from the highest priority active source provider.
* **UI Controls:** Renders standard play/pause, volume, fullscreen, and video quality selectors. The native browser Cast/AirPlay buttons are enabled for smart TVs.

### Edge Case: Mobile Network Degradation (4G to 3G/Offline)
* **Behavior:** The user's mobile signal drops while watching on a transit route.
* **System Resolution:**
  1. The HLS player's adaptive bitrate (ABR) engine detects bandwidth reduction and dynamically shifts down to the lowest video resolution chunklist.
  2. If the connection drops completely (no chunks received), the player enters a buffering state.
  3. Instead of showing a raw browser error page or a frozen black box, a premium custom loading spinner overlay displays:
     `"Reconnecting... checking your connection."`
  4. The player attempts to resume the playlist segment download for up to 30 seconds. If connection is restored, the video resumes automatically. If it times out, a fallback screen offers a reload prompt and a quick link to support.

### Edge Case: Session Eviction (Concurrent Playback Abuse)
* **Context:** A user shares their code/account credentials, and another person logs in on a different device, booting the active viewer out.
* **UX Feedback:**
  * The active HLS stream on the first device halts immediately.
  * The player interface is replaced by a secure overlay:
    `"Session Suspended. Your account is active on another device. Only one active stream is permitted per pass. If this was not you, please log in again or contact WhatsApp support."`

---

## MODULE 4: The Back-Office Admin Verification Matrix

### Normal Path: Manual Payment Approval & Snippet Copy
* **Admin Actions:**
  1. The admin receives a screenshot receipt and transaction reference code (e.g., `TXN-ABCD1234`) on WhatsApp from a client.
  2. The admin opens the Admin Dashboard, clicks **Payments**, and locates the matching transaction ID or reference name.
  3. The admin verifies the fund arrival on their banking portal and clicks **"Approve"** on the matching table row.
  4. **Code Generation:** The system updates the payment status to `approved`, selects an unused `AccessCode` for the purchased plan, assigns it to the customer's phone number, and updates the database.
  5. **Clipboard Snippet:** A toast message displays: `"Payment Approved! Code assigned."` along with a quick-copy snippet copy helper:
     `"Hi! Your payment has been verified. Here is your access code: ABCD-1234. Redeem it here: https://yourplatform.com/redeem"`
  6. The admin clicks the copy button and paste-sends it directly back to the customer on WhatsApp.

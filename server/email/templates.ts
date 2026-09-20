export type IslandRideEmailTemplateKey = "ride-requested" | "driver-assigned" | "ride-completed";

export type IslandRideEmailInput = {
  customerName: string;
  reference: string;
  pickupAddress: string;
  dropoffAddress: string;
  appUrl: string;
  driverName?: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function renderIslandRideEmail(
  key: IslandRideEmailTemplateKey,
  input: IslandRideEmailInput,
) {
  const customerName = input.customerName.trim() || "IslandRide rider";
  const safeName = escapeHtml(customerName);
  const safeReference = escapeHtml(input.reference);
  const safePickup = escapeHtml(input.pickupAddress);
  const safeDropoff = escapeHtml(input.dropoffAddress);
  const safeAppUrl = escapeHtml(input.appUrl);

  if (key === "driver-assigned") {
    const driverName = input.driverName?.trim() || "your IslandRide driver";
    return {
      subject: `Your IslandRide driver is assigned — ${input.reference}`,
      text: `${driverName} is assigned to ride ${input.reference}. Track your ride in IslandRide: ${input.appUrl}`,
      html: `<h1>Your driver is assigned</h1><p><strong>${escapeHtml(driverName)}</strong> is assigned to ride <strong>${safeReference}</strong>.</p><p><a href="${safeAppUrl}">Track your ride</a></p>`,
    };
  }

  if (key === "ride-completed") {
    return {
      subject: `IslandRide trip complete — ${input.reference}`,
      text: `Hi ${customerName}, your trip from ${input.pickupAddress} to ${input.dropoffAddress} is complete. Reference: ${input.reference}.`,
      html: `<h1>Trip complete</h1><p>Hi ${safeName}, your trip from <strong>${safePickup}</strong> to <strong>${safeDropoff}</strong> is complete.</p><p>Reference: ${safeReference}</p>`,
    };
  }

  return {
    subject: `IslandRide request received — ${input.reference}`,
    text: `Hi ${customerName}, we received your ride request from ${input.pickupAddress} to ${input.dropoffAddress}. Reference: ${input.reference}. Track status in IslandRide: ${input.appUrl}`,
    html: `<h1>Ride request received</h1><p>Hi ${safeName}, we received your request from <strong>${safePickup}</strong> to <strong>${safeDropoff}</strong>.</p><p>Reference: ${safeReference}</p><p><a href="${safeAppUrl}">View ride status</a></p>`,
  };
}

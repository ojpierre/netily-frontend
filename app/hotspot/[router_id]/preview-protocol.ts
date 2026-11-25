// Message type shared by the captive portal (embed mode) and the admin Live Preview.
// The admin page posts `{ type: PORTAL_PREVIEW_MESSAGE, config }` into the iframe; the
// portal answers `{ type: PORTAL_PREVIEW_READY }` once it is listening.
export const PORTAL_PREVIEW_MESSAGE = "netily-portal-preview"
export const PORTAL_PREVIEW_READY = "netily-portal-preview-ready"

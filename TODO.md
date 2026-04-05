# FlipCut — TODO (Sunday April 5)

## Backend
- [x] Build delete lambda — hard delete (remove from S3 + DynamoDB)
- [ ] Add error status handling — if mutate fails, write `status: "error"` to DynamoDB so the frontend can show a failure instead of timing out

## Frontend — Core Features
- [x] Delete flow: confirmation modal ("Are you sure? This can't be undone"), then call `DELETE /images?jobId=xxx`, navigate home on success
- [x] Download button on result page — fetch + blob for cross-origin
- [x] Copy image to clipboard (with URL fallback)
- [x] In-memory job cache — navigating back to a completed job shows result instantly without re-polling
- [ ] Local storage cache of recent jobs — store `{ jobId, status, createdAt }` array, show on home page as "Recent" list
- [x] Clickable wordmark in header → links back to home (`/`)

## Frontend — UI Polish
- [ ] Add a brief "How it works" section below the upload zone (3 steps: upload → we remove bg & flip → download)
- [ ] Footer with branding / attribution
- [ ] Favicon
- [ ] Better error states — distinct UI for upload failure vs processing timeout vs network error
- [ ] Loading skeleton on result page before first poll returns
- [ ] Success animation/transition when image appears (fade in)
- [ ] Mobile responsive pass — test on small screens
- [ ] Accessibility: focus states, aria labels on buttons, alt text

## UX Nice-to-Haves
- [ ] Drag-and-drop visual feedback — show image preview in the drop zone before confirming
- [ ] "Process another" button on the result page
- [ ] Toast notifications instead of inline error banners
- [ ] Show original vs processed side-by-side comparison
- [ ] Progress bar instead of just status text (map statuses to percentage)
- [ ] Copy share link (the `/#/job/{jobId}` URL, not just the image URL)
- [ ] Time elapsed counter while processing ("12s elapsed…")

## Deploy
- [ ] Build frontend (`npm run build`)
- [ ] Upload `dist/` contents to S3 frontend bucket
- [ ] Invalidate CloudFront cache

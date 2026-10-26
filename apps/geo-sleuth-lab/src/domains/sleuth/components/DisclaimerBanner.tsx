import { Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DisclaimerBanner() {
  return (
    <Alert data-testid="privacy-banner">
      <Shield />
      <AlertTitle>Use your own photos or public landmarks only. Not for stalking or tracking people.</AlertTitle>
      <AlertDescription>
        This demo never uses personal location tracking. Sample plates are synthetic illustrations of public landmarks. Uploads are not geolocated, and EXIF GPS is ignored.
      </AlertDescription>
    </Alert>
  )
}

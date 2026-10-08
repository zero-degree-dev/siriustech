/** Browser-only interaction between service links and the existing form. */
export const SERVICE_SELECTION_EVENT = 'siriustech:select-service';
export function selectProjectService(serviceId: string) {
 window.dispatchEvent(new CustomEvent<string>(SERVICE_SELECTION_EVENT, { detail: serviceId }));
}

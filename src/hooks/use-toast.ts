export interface ToastProps {title?:string;description?:string;variant?:"default"|"destructive";}
export function useToast(){return {toasts:[] as ToastProps[],toast:({title,description}:ToastProps)=>window.dispatchEvent(new CustomEvent("crm-toast",{detail:[title,description].filter(Boolean).join(" · ")}))};}

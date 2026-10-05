export interface CargoItemDTO {
  id: string;
  containerId: string;
  description: string | null;
  numberOfPieces: number | null;
  pieceType: string | null;
  grossWeightLbs: number | null;
  grossWeightKgs: number | null;
  grossSizeCft: number | null;
  grossSizeCbm: number | null;
  declaredValueCents: number | null;
  isVehicle: boolean;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleTitle: string | null;
  vehicleState: string | null;
}

export interface CargoContainerDTO {
  id: string;
  shipmentId: string;
  containerNumber: string | null;
  containerType: string | null;
  seal1: string | null;
  seal2: string | null;
  seal3: string | null;
  tareWeightLbs: number | null;
  tareWeightKgs: number | null;
  grossWeightLbs: number | null;
  grossWeightKgs: number | null;
  vgmWeight: number | null;
  items: CargoItemDTO[];
}

export interface LookupOption {
  value: string;
  label: string;
}

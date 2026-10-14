/**
 * Zoho Desk ticket layouts mirrored on the Shipment form — GENERATED from Zoho's layout API
 * (GET /api/v1/layouts/{id}, Sky2C org) on 2026-10-14. Sections, field order, labels and
 * picklist options are exactly Zoho's; only custom fields (cf_*) are included, minus
 * internal helpers (cf_consol_hidden, cf_console_record_id, cf_formatter_applied).
 * To refresh after a layout change in Zoho, regenerate rather than hand-edit.
 *
 * Air Ops layouts belong to parent shipments; Dispatch and Booking layouts to the child
 * shipments raised from them (see parent/child in src/lib/zohoShipmentSync.ts).
 */

export type LayoutFieldType = "text" | "textarea" | "picklist" | "multiselect" | "decimal" | "currency" | "datetime" | "date" | "boolean";

export interface LayoutField {
  /** Zoho custom-field API name, as it appears in webhook payloads (`payload.cf.*`). */
  apiName: string;
  label: string;
  type: LayoutFieldType;
  options?: readonly string[];
}

export interface LayoutSection {
  title: string;
  fields: readonly LayoutField[];
}

export interface ZohoLayout {
  name: string;
  zohoLayoutId: string;
  sections: readonly LayoutSection[];
}

export interface LayoutGroup {
  department: string;
  zohoDepartmentId: string;
  /** "parent": Air Ops tickets (top-level shipments); "child": tickets raised from them. */
  role: "parent" | "child";
  layouts: readonly ZohoLayout[];
}

const VIA_WAREHOUSE_LAYOUT: ZohoLayout = {
  name: "Via Warehouse",
  zohoLayoutId: "145882000002732950",
  sections: [
    {
      title: "Ticket Information",
      fields: [
        { apiName: "cf_ref_number", label: "Ref Number", type: "text" },
        { apiName: "cf_shipment_type_1", label: "Shipment Type", type: "picklist", options: ["Non Consolidation","Possible Consolidation","Clubbed Shipment","Consolidation Service"] },
        { apiName: "cf_consol_id", label: "Consol ID", type: "text" },
        { apiName: "cf_on_hold_reason", label: "On-Hold Reason", type: "picklist", options: ["Adding More Cargo","Waiting for Documents","Shipper Hold","Other"] },
        { apiName: "cf_on_hold_reason_1", label: "Other On-Hold Reason", type: "textarea" },
        { apiName: "cf_dispatch_route", label: "Dispatch Route", type: "picklist", options: ["Via Warehouse","Direct to Port"] },
        { apiName: "cf_hawb_involved", label: "HAWB Involved", type: "picklist", options: ["Yes","No"] },
        { apiName: "cf_dispatch_ticket", label: "Initiate Dispatch", type: "boolean" },
        { apiName: "cf_booking_ticket", label: "Initiate Booking", type: "boolean" },
        { apiName: "cf_operation_ticket", label: "Initiate Dispatch from Warehouse", type: "boolean" },
      ],
    },
    {
      title: "Shipment Summary",
      fields: [
        { apiName: "cf_awb", label: "AWB", type: "text" },
        { apiName: "cf_origin", label: "Origin Port", type: "text" },
        { apiName: "cf_destination", label: "Destination Port", type: "text" },
        { apiName: "cf_etd", label: "ETD", type: "date" },
        { apiName: "cf_eta", label: "ETA", type: "date" },
        { apiName: "cf_pre_decided_carrier", label: "Pre-decided Carrier", type: "picklist", options: ["Yes","No"] },
        { apiName: "cf_carrier_picklist", label: "Carrier-Name", type: "picklist", options: ["Korean Air Lines","Silk Way West Airlines","Nippon Cargo Airlines NCA","Carousel Logistics","Etihad Airways","JetBlue","Egyptair","Qatar Airways","Japan Airlines","Air Canada","Virgin Atlantic Airways","Delta Air Lines","United Airlines","Turkmenistan Airlines","Finnair","Ethiopian Airlines","Fedex","Euroasian GSA","Air France","Norse Atlantic Airways","CargoJet Airlines","Shenzhen Andashun ADS Masterloader","China Eastern","ITA Airways Cargo","American Airlines Cargo","Fits Cargo","Caribbean Airlines Cargo","MNG","EL AL Israel Airlines","Avianca Cargo","Air India","LATAM Airlines","Scandinavian Airlines SAS","Emirates","British Airways","Lufthansa","IAG Group British Airways Iberia","KUB Air Cargo CSA","KLM","Sun Class","Widerøe","Turkish Airlines","Condor","China Southern","ANA Cargo All Nippon Airways","Chapman Freeborn","Thai Cargo","TUI","TAP Air Cargo","OS","Vueling Cargo","Aer Lingus","Gulf Air","Oman Air","Swiss","Philippine Airlines","UPS Airlines","Royal Air Maroc","Polar Air Cargo","Cargolux","Air Class Lineas Aereas","Copa Airlines","Atlas Air","China Cargo Airlines Ltd","Asiana","Fiji Airways","MSC AIR CARGO","LOT Polish Airlines","Rwandair","Singapore Airlines","Southwest Airlines","Alaska Airlines","Air New Zealand","Air Tahiti Nui","Mercury Americas","Icelandair","SriLankan","Cathay Cargo","Air Europa","Kalitta","Hawaiian","Air Menzies International","Qantas Airways","Kuwait Airways","EAT DHL Aviation","Saudi Arabian Airlines","China Airlines","EVA Air","Amerijet International","Vietnam Airlines","Hong Kong Airlines","Neos","Malaysia Airlines","Kenya Airways","Pakistan International Airlines","Royal Jordanian","Tampa Cargo","South African Airways","Aeromexico","Cayman Airways","Star Air","WestJet","Sun Country Airlines","Hainan Airlines","Wright Air Service","VivaAerobus","Air Europe","Equaflight Service","Aerolineas Argentinas","Avianca El Salvador","Omskavia Airlines","Bringer Air Cargo","Air Malta","Warbelows Air Ventures","TAAG Angola Airlines","MIAT Mongolian Airlines","Air Serbia","Hong Kong Air Cargo","Air Mauritius","FrenchBee","Xiamen Airlines","CAL Cargo Air Lines","IAG Cargo","Air Menzies","Shipco Transport","Solent Freight Services","Air China Limited","American Worldwide Agencies","Sichuan Airlines","DNA Logistics","Aerounion","Heavyweight Air Express","Air Senegal SA","HiSky","Volaris","Azul Cargo","Air Premia","Shared Freight Service","UAC","MasAir","Trans Caribbean Cargo","My Freighter","IBC Airways","Astral Aviation","Starlux Cargo","Magma Aviation","Arkia Israeli Airlines","Garuda Indonesia Cargo","CMA CGM","Coyne Airways","Azerbaijan Hava Yollary","AirZeta","Skyworld Air Cargo","Air Transat","Skynet","AirAsia X","CEBU Pacific Air","MSC","Other"] },
        { apiName: "cf_carrier", label: "Carrier", type: "text" },
        { apiName: "cf_shipper_1", label: "Shipper", type: "picklist", options: ["Known","Unknown","Yet to Confirm"] },
        { apiName: "cf_drop_date", label: "Drop Date", type: "datetime" },
        { apiName: "cf_quote_amount_1", label: "Quote Amount", type: "currency" },
        { apiName: "cf_quote_basis", label: "Quote Basis", type: "picklist", options: ["Yet to Confirm","Flat","Per Kg"] },
        { apiName: "cf_quoted_by", label: "Quoted By", type: "text" },
        { apiName: "cf_hawb", label: "HAWB", type: "text" },
        { apiName: "cf_service_type", label: "Service Type", type: "picklist", options: ["Door to Door","Door to Port","Port to Port","Port to Door"] },
        { apiName: "cf_trucking_by", label: "Shipment Terms", type: "picklist", options: ["EXW","FCA","CPT","CIP","DAP","DPU","DDP","FAS","FOB","CFR","CIF"] },
      ],
    },
    {
      title: "Cargo Details",
      fields: [
        { apiName: "cf_pallets_x_dimensions", label: "Pallets x Dimensions", type: "textarea" },
        { apiName: "cf_gross_weight", label: "Gross Weight", type: "decimal" },
        { apiName: "cf_volumetric_weight", label: "Volumetric Weight", type: "decimal" },
        { apiName: "cf_chargeable_weight", label: "Chargeable Weight", type: "decimal" },
        { apiName: "cf_commodity_detail", label: "Commodity Detail", type: "text" },
        { apiName: "cf_stackable_and_turnable", label: "Stackable and Turnable", type: "multiselect", options: ["Stackable","Turnable","Non-Stackable"] },
      ],
    },
    {
      title: "Consol Details",
      fields: [
        { apiName: "cf_consol_pallets_and_dimensions", label: "Consol Pallets and Dimensions", type: "textarea" },
        { apiName: "cf_consol_gross_weight", label: "Consol Gross Weight", type: "decimal" },
        { apiName: "cf_consol_volumetric_weight", label: "Consol Volumetric Weight", type: "decimal" },
        { apiName: "cf_consol_chargeable_weight", label: "Consol Chargeable Weight", type: "decimal" },
        { apiName: "cf_consol_commodity_detail", label: "Consol Commodity Detail", type: "text" },
        { apiName: "cf_consol_reference", label: "Consol Reference", type: "text" },
        { apiName: "cf_consol_stackable_and_turnable", label: "Consol Stackable and Turnable", type: "picklist", options: ["Stackable"] },
      ],
    },
    {
      title: "Dispatch Details",
      fields: [
        { apiName: "cf_pickup_location", label: "Pickup Location", type: "text" },
        { apiName: "cf_contact_details", label: "Contact Details", type: "textarea" },
        { apiName: "cf_location_type", label: "Location Type", type: "picklist", options: ["Residential","Commercial"] },
        { apiName: "cf_dock_hours", label: "Dock Hours", type: "text" },
        { apiName: "cf_variable_2", label: "SO Number", type: "text" },
        { apiName: "cf_preferred_pickup_date", label: "Preferred Pickup Date", type: "datetime" },
        { apiName: "cf_pickup_instructions", label: "Pickup Instructions", type: "textarea" },
        { apiName: "cf_warehouse_pickup_instructions", label: "Warehouse Pickup Instructions", type: "textarea" },
        { apiName: "cf_warehouse_location", label: "Warehouse Location", type: "text" },
        { apiName: "cf_drop_documents_attached", label: "Drop Documents Attached", type: "boolean" },
      ],
    },
    {
      title: "Booking Section",
      fields: [
        { apiName: "cf_booking_instructions", label: "Booking Instructions", type: "textarea" },
        { apiName: "cf_booking_rate", label: "Booking Rate", type: "currency" },
        { apiName: "cf_port_drop_location", label: "Port Drop Location", type: "text" },
        { apiName: "cf_drop_cut_off_time", label: "Drop Cut Off Time", type: "datetime" },
      ],
    },
    {
      title: "Critical Time Logs",
      fields: [
        { apiName: "cf_pickup_request_generation_time", label: "Pickup Request Generation Time", type: "datetime" },
        { apiName: "cf_booking_request_generation_time", label: "Booking Request Generation Time", type: "datetime" },
        { apiName: "cf_booking_completion_time", label: "Booking Completion Time", type: "datetime" },
        { apiName: "cf_pickup_schedule_time", label: "Pickup Schedule Time", type: "datetime" },
        { apiName: "cf_pickup_time", label: "ETA for Pickup", type: "datetime" },
        { apiName: "cf_pickup_date", label: "Pickup Date", type: "datetime" },
        { apiName: "cf_eta_at_warehouse", label: "ETA at Warehouse", type: "datetime" },
        { apiName: "cf_on_hand_date", label: "On-Hand Date", type: "datetime" },
        { apiName: "cf_on_hand_details", label: "On-Hand Details", type: "textarea" },
        { apiName: "cf_eta_for_warehouse_pickup", label: "ETA for Warehouse Pickup", type: "datetime" },
        { apiName: "cf_warehouse_pickup_date", label: "Warehouse Pickup Date", type: "datetime" },
        { apiName: "cf_eta_for_port_drop", label: "ETA for Port Drop", type: "datetime" },
        { apiName: "cf_port_drop_date", label: "Port Drop Date", type: "datetime" },
        { apiName: "cf_sla_breaches", label: "SLA Breaches", type: "picklist", options: ["Option 1","Option 2"] },
      ],
    },
    {
      title: "Escalation",
      fields: [
        { apiName: "cf_escalated", label: "Escalated", type: "boolean" },
        { apiName: "cf_escalation_reason", label: "Escalation Reason", type: "multiselect", options: ["Incomplete or inaccurate documents","Incorrect HS codes or valuation errors","Late document submission to carriers or customs.","Regulatory non-compliance","Delay in cargo readiness from shipper","Improper packaging or labeling that doesn’t meet transport or regulatory requirements","Capacity issues with carriers","Repeated offloading at origin","Space allocation mistakes","Equipment shortages","Carrier delays","Route diversions due to weather or strikes or geopolitical events","Damage or loss of cargo during handling or transit","Security issues (cargo theft or tampering or piracy)","Customs holds at transshipment hubs","Customs queries or inspections due to mismatched or incomplete documentation","Incorrect duty/tax calculations","Regulatory restrictions","Lack of importer codes / permits at destination","Late payment of duties and taxes","Trucking shortages or delays (driver strikes or fuel shortages)","Missed delivery appointments at warehouses","Restricted delivery access","Wrong delivery address or consignee unprepared","Demurrage / detention charges escalation if cargo is not picked up or returned timely","Poor coordination between shipper or forwarder or carrieror customs broker and consignee","Lack of proactive updates on shipment status","Failure to escalate internally early enough or causing customer dissatisfaction","Misaligned expectations ( transit time promises vs. actual carrier performance)","Improper Screening of Cargo","Pre-Alert not sent","DN and Billing not done","Entry not done Descartes","Shipment in negative","Other"] },
        { apiName: "cf_severity", label: "Severity", type: "picklist", options: ["Low","Medium","High"] },
        { apiName: "cf_additional_comment", label: "Additional Comments", type: "text" },
        { apiName: "cf_defaulter", label: "Defaulter", type: "picklist", options: ["Controller","Trucker","Warehouse Operator","Carrier","Import Team","Ground Handling Agent - GHA","Shipper","Consignee"] },
        { apiName: "cf_handler", label: "Handler", type: "picklist", options: ["William","Tara","Monika","Neil","Sunil","Controller"] },
        { apiName: "cf_escalation_status", label: "Escalation Status", type: "picklist", options: ["Pending","In-Progress","Resolved"] },
        { apiName: "cf_expected_resolution_date", label: "Expected Resolution Date", type: "date" },
      ],
    },
    {
      title: "Additional Information",
      fields: [
        { apiName: "cf_destination_address", label: "Destination Address", type: "text" },
        { apiName: "cf_consignee_details", label: "Consignee Details", type: "textarea" },
      ],
    },
  ],
};

const DIRECT_TO_PORT_LAYOUT: ZohoLayout = {
  name: "Direct to Port",
  zohoLayoutId: "145882000113663895",
  sections: [
    {
      title: "Ticket Information",
      fields: [
        { apiName: "cf_ref_number", label: "Ref Number", type: "text" },
        { apiName: "cf_shipment_type_1", label: "Shipment Type", type: "picklist", options: ["Non Consolidation"] },
        { apiName: "cf_on_hold_reason", label: "On-Hold Reason", type: "picklist", options: ["Adding More Cargo","Waiting for Documents","Shipper Hold","Other"] },
        { apiName: "cf_on_hold_reason_1", label: "Other On-Hold Reason", type: "textarea" },
        { apiName: "cf_dispatch_route", label: "Dispatch Route", type: "picklist", options: ["Via Warehouse","Direct to Port"] },
        { apiName: "cf_hawb_involved", label: "HAWB Involved", type: "picklist", options: ["Yes","No"] },
        { apiName: "cf_dispatch_ticket", label: "Initiate Dispatch", type: "boolean" },
        { apiName: "cf_booking_ticket", label: "Initiate Booking", type: "boolean" },
      ],
    },
    {
      title: "Shipment Summary",
      fields: [
        { apiName: "cf_awb", label: "AWB", type: "text" },
        { apiName: "cf_origin", label: "Origin Port", type: "text" },
        { apiName: "cf_destination", label: "Destination Port", type: "text" },
        { apiName: "cf_etd", label: "ETD", type: "date" },
        { apiName: "cf_eta", label: "ETA", type: "date" },
        { apiName: "cf_pre_decided_carrier", label: "Pre-decided Carrier", type: "picklist", options: ["Yes","No"] },
        { apiName: "cf_carrier_picklist", label: "Carrier-Name", type: "picklist", options: ["NA","Korean Air Lines","Silk Way West Airlines","Nippon Cargo Airlines NCA","Carousel Logistics","Etihad Airways","JetBlue","Egyptair","Qatar Airways","Japan Airlines","Air Canada","Virgin Atlantic Airways","Delta Air Lines","United Airlines","Turkmenistan Airlines","Finnair","Ethiopian Airlines","Fedex","Euroasian GSA","Air France","Norse Atlantic Airways","CargoJet Airlines","Shenzhen Andashun ADS Masterloader","China Eastern","ITA Airways Cargo","American Airlines Cargo","Fits Cargo","Caribbean Airlines Cargo","MNG","EL AL Israel Airlines","Avianca Cargo","Air India","LATAM Airlines","Scandinavian Airlines SAS","Emirates","British Airways","Lufthansa","IAG Group British Airways Iberia","KUB Air Cargo CSA","KLM","Sun Class","Widerøe","Turkish Airlines","Condor","China Southern","ANA Cargo All Nippon Airways","Chapman Freeborn","Thai Cargo","TUI","TAP Air Cargo","OS","Vueling Cargo","Aer Lingus","Gulf Air","Oman Air","Swiss","Philippine Airlines","UPS Airlines","Royal Air Maroc","Polar Air Cargo","Cargolux","Air Class Lineas Aereas","Copa Airlines","Atlas Air","China Cargo Airlines Ltd","Asiana","Fiji Airways","MSC AIR CARGO","LOT Polish Airlines","Rwandair","Singapore Airlines","Southwest Airlines","Alaska Airlines","Air New Zealand","Air Tahiti Nui","Mercury Americas","Icelandair","SriLankan","Cathay Cargo","Air Europa","Kalitta","Hawaiian","Air Menzies International","Qantas Airways","Kuwait Airways","EAT DHL Aviation","Saudi Arabian Airlines","China Airlines","EVA Air","Amerijet International","Vietnam Airlines","Hong Kong Airlines","Neos","Malaysia Airlines","Kenya Airways","Pakistan International Airlines","Royal Jordanian","Tampa Cargo","South African Airways","Aeromexico","Cayman Airways","Star Air","WestJet","Sun Country Airlines","Hainan Airlines","Wright Air Service","VivaAerobus","Air Europe","Equaflight Service","Aerolineas Argentinas","Avianca El Salvador","Omskavia Airlines","Bringer Air Cargo","Air Malta","Warbelows Air Ventures","TAAG Angola Airlines","MIAT Mongolian Airlines","Air Serbia","Hong Kong Air Cargo","Air Mauritius","FrenchBee","Xiamen Airlines","CAL Cargo Air Lines","IAG Cargo","Air Menzies","Shipco Transport","Solent Freight Services","Air China Limited","American Worldwide Agencies","Sichuan Airlines","DNA Logistics","Aerounion","Heavyweight Air Express","Air Senegal SA","HiSky","Volaris","Azul Cargo","Air Premia","Shared Freight Service","UAC","MasAir","Trans Caribbean Cargo","My Freighter","IBC Airways","Astral Aviation","Starlux Cargo","Magma Aviation","Arkia Israeli Airlines","Garuda Indonesia Cargo","CMA CGM","Coyne Airways","Azerbaijan Hava Yollary","AirZeta","Skyworld Air Cargo","Air Transat","Skynet","AirAsia X","CEBU Pacific Air","MSC","Other"] },
        { apiName: "cf_carrier", label: "Carrier", type: "text" },
        { apiName: "cf_shipper_1", label: "Shipper", type: "picklist", options: ["Known","Unknown","Yet to Confirm"] },
        { apiName: "cf_drop_date", label: "Drop Date", type: "datetime" },
        { apiName: "cf_quote_amount_1", label: "Quote Amount", type: "currency" },
        { apiName: "cf_quote_basis", label: "Quote Basis", type: "picklist", options: ["Yet to Confirm","Flat","Per Kg"] },
        { apiName: "cf_quoted_by", label: "Quoted By", type: "text" },
        { apiName: "cf_hawb", label: "HAWB", type: "text" },
        { apiName: "cf_service_type", label: "Service Type", type: "picklist", options: ["Door to Door","Door to Port","Port to Port","Port to Door"] },
        { apiName: "cf_trucking_by", label: "Shipment Terms", type: "picklist", options: ["EXW","FCA","CPT","CIP","DAP","DPU","DDP","FAS","FOB","CFR","CIF"] },
      ],
    },
    {
      title: "Cargo Details",
      fields: [
        { apiName: "cf_pallets_x_dimensions", label: "Pallets x Dimensions", type: "textarea" },
        { apiName: "cf_gross_weight", label: "Gross Weight", type: "decimal" },
        { apiName: "cf_volumetric_weight", label: "Volumetric Weight", type: "decimal" },
        { apiName: "cf_chargeable_weight", label: "Chargeable Weight", type: "decimal" },
        { apiName: "cf_commodity_detail", label: "Commodity Detail", type: "text" },
        { apiName: "cf_stackable_and_turnable", label: "Stackable and Turnable", type: "multiselect", options: ["Stackable","Turnable","Non-Stackable"] },
      ],
    },
    {
      title: "Dispatch Details",
      fields: [
        { apiName: "cf_pickup_location", label: "Pickup Location", type: "text" },
        { apiName: "cf_contact_details", label: "Contact Details", type: "textarea" },
        { apiName: "cf_location_type", label: "Location Type", type: "picklist", options: ["Residential","Commercial"] },
        { apiName: "cf_dock_hours", label: "Dock Hours", type: "text" },
        { apiName: "cf_variable_2", label: "SO Number", type: "text" },
        { apiName: "cf_preferred_pickup_date", label: "Preferred Pickup Date", type: "datetime" },
        { apiName: "cf_pickup_instructions", label: "Pickup Instructions", type: "textarea" },
        { apiName: "cf_drop_documents_attached", label: "Drop Documents Attached", type: "boolean" },
      ],
    },
    {
      title: "Booking Section",
      fields: [
        { apiName: "cf_booking_instructions", label: "Booking Instructions", type: "textarea" },
        { apiName: "cf_booking_rate", label: "Booking Rate", type: "currency" },
        { apiName: "cf_port_drop_location", label: "Port Drop Location", type: "text" },
        { apiName: "cf_drop_cut_off_time", label: "Drop Cut Off Time", type: "datetime" },
      ],
    },
    {
      title: "Critical Time Logs",
      fields: [
        { apiName: "cf_pickup_request_generation_time", label: "Pickup Request Generation Time", type: "datetime" },
        { apiName: "cf_booking_request_generation_time", label: "Booking Request Generation Time", type: "datetime" },
        { apiName: "cf_booking_completion_time", label: "Booking Completion Time", type: "datetime" },
        { apiName: "cf_pickup_schedule_time", label: "Pickup Schedule Time", type: "datetime" },
        { apiName: "cf_pickup_time", label: "ETA for Pickup", type: "datetime" },
        { apiName: "cf_pickup_date", label: "Pickup Date", type: "datetime" },
        { apiName: "cf_eta_for_port_drop", label: "ETA for Port Drop", type: "datetime" },
        { apiName: "cf_port_drop_date", label: "Port Drop Date", type: "datetime" },
        { apiName: "cf_sla_breaches", label: "SLA Breaches", type: "picklist", options: ["Pickup Request Generation","Booking Request Generation","Booking Completion Time","Pickup Schedule Time","Port Drop Missed"] },
      ],
    },
    {
      title: "Escalation",
      fields: [
        { apiName: "cf_escalated", label: "Escalated", type: "boolean" },
        { apiName: "cf_escalation_reason", label: "Escalation Reason", type: "multiselect", options: ["Incomplete or inaccurate documents","Incorrect HS codes or valuation errors","Late document submission to carriers or customs.","Regulatory non-compliance","Delay in cargo readiness from shipper","Improper packaging or labeling that doesn’t meet transport or regulatory requirements","Capacity issues with carriers","Repeated offloading at origin","Space allocation mistakes","Equipment shortages","Carrier delays","Route diversions due to weather or strikes or geopolitical events","Damage or loss of cargo during handling or transit","Security issues (cargo theft or tampering or piracy)","Customs holds at transshipment hubs","Customs queries or inspections due to mismatched or incomplete documentation","Incorrect duty/tax calculations","Regulatory restrictions","Lack of importer codes / permits at destination","Late payment of duties and taxes","Trucking shortages or delays (driver strikes or fuel shortages)","Missed delivery appointments at warehouses","Restricted delivery access","Wrong delivery address or consignee unprepared","Demurrage / detention charges escalation if cargo is not picked up or returned timely","Poor coordination between shipper or forwarder or carrieror customs broker and consignee","Lack of proactive updates on shipment status","Failure to escalate internally early enough or causing customer dissatisfaction","Misaligned expectations ( transit time promises vs. actual carrier performance)","Improper Screening of Cargo","Pre-Alert not sent","DN and Billing not done","Entry not done Descartes","Shipment in negative","Air Booking Delayed","Port Drop Missed","Other"] },
        { apiName: "cf_severity", label: "Severity", type: "picklist", options: ["Low","Medium","High"] },
        { apiName: "cf_additional_comment", label: "Additional Comments", type: "text" },
        { apiName: "cf_defaulter", label: "Defaulter", type: "picklist", options: ["Controller","Dispatch Operator","Booking Operator","Trucker","Warehouse Operator","Carrier","Import Team","Ground Handling Agent - GHA","Shipper","Consignee"] },
        { apiName: "cf_handler", label: "Handler", type: "picklist", options: ["William","Tara","Monika","Neil","Sunil","Controller"] },
        { apiName: "cf_escalation_status", label: "Escalation Status", type: "picklist", options: ["Pending","In-Progress","Resolved"] },
        { apiName: "cf_expected_resolution_date", label: "Expected Resolution Date", type: "date" },
      ],
    },
  ],
};

const DISPATCH_TO_WAREHOUSE_LAYOUT: ZohoLayout = {
  name: "Dispatch to Warehouse",
  zohoLayoutId: "145882000106932243",
  sections: [
    {
      title: "Ticket Information",
      fields: [
        { apiName: "cf_ref_number", label: "Ref Number", type: "text" },
        { apiName: "cf_shipment_type_1", label: "Shipment Type", type: "picklist", options: ["Non Consolidation","Clubbed Shipment","Consolidation Service"] },
        { apiName: "cf_send_to_vhaul", label: "Send to Vhaul", type: "boolean" },
      ],
    },
    {
      title: "Dispatch Instructions",
      fields: [
        { apiName: "cf_origin", label: "Origin Port", type: "text" },
        { apiName: "cf_destination", label: "Destination Port", type: "text" },
        { apiName: "cf_shipper_1", label: "Shipper", type: "picklist", options: ["Known","Unknown","Yet to Confirm"] },
        { apiName: "cf_quote_amount_1", label: "Quote Amount", type: "currency" },
        { apiName: "cf_quote_basis", label: "Quote Basis", type: "picklist", options: ["Flat","Per Kg"] },
        { apiName: "cf_quoted_by", label: "Quoted By", type: "text" },
        { apiName: "cf_pallets_x_dimensions", label: "Pallets x Dimensions", type: "textarea" },
        { apiName: "cf_gross_weight", label: "Gross Weight", type: "decimal" },
        { apiName: "cf_volumetric_weight", label: "Volumetric Weight", type: "decimal" },
        { apiName: "cf_chargeable_weight", label: "Chargeable Weight", type: "decimal" },
        { apiName: "cf_commodity_detail", label: "Commodity Detail", type: "text" },
        { apiName: "cf_stackable_and_turnable", label: "Stackable and Turnable", type: "multiselect", options: ["Stackable","Turnable","Non-Stackable"] },
        { apiName: "cf_service_type", label: "Service Type", type: "picklist", options: ["Door to Door","Door to Port","Port to Port","Port to Door"] },
        { apiName: "cf_trucking_by", label: "Shipment Terms", type: "picklist", options: ["EXW","FCA","CPT","CIP","DAP","DPU","DDP","FAS","FOB","CFR","CIF"] },
      ],
    },
    {
      title: "Pickup Instructions",
      fields: [
        { apiName: "cf_pickup_location", label: "Pickup Location", type: "text" },
        { apiName: "cf_contact_details", label: "Contact Details", type: "textarea" },
        { apiName: "cf_location_type", label: "Location Type", type: "picklist", options: ["Residential","Commercial"] },
        { apiName: "cf_dock_hours", label: "Dock Hours", type: "text" },
        { apiName: "cf_variable_2", label: "SO Number", type: "text" },
        { apiName: "cf_preferred_pickup_date", label: "Preferred Pickup Date", type: "datetime" },
        { apiName: "cf_pickup_instructions", label: "Pickup Instructions", type: "textarea" },
      ],
    },
    {
      title: "Dispatch Operations",
      fields: [
        { apiName: "cf_dispatch_route", label: "Dispatch Route", type: "picklist", options: ["Via Warehouse","Direct to Port"] },
        { apiName: "cf_warehouse_location", label: "Warehouse Location", type: "text" },
        { apiName: "cf_carrier_picklist", label: "Carrier-Name", type: "picklist", options: ["Vhaul4u","Saia LTL Freight","Roadrunner Transport Service","Fedex","UPS","Estes","17 Post Service","2ebox","2GO","360 Lion Express","3JMS Logistics","472 Entregando","4PX","Best Express","A1Post","A2B Express Logistics","AAA Cooper","ABF Freight","ABX Express","aCommerce","ACS Courier","ACS Worldwide Express","Adicional Logistics","ADSOne","A Duie Pyle","Mexico AeroFlash","Aeronet","AEX Group","Agility","AIR21","Airpak Express","Airspeed International Corporation","ALLJOY SUPPLY CHAIN CO","alphaFAST","Always Express","Amazon Shipping Amazon MCF","Amazon","Swiship UK","Swiship DE","Swiship IN","Amazon order","Amazon Shipping","AMS Group","An Post","Anicam Global","Anjun","ANSERX","Anteraja","AO Deutschland Ltd","APC Postal Logistics","APC Overnight","APC Overnight Consignment Number","APG eCommerce Solutions Ltd","Aquiline","Arco Spedizioni SP","ARK Logistics","Arrow XL","ASE KARGO","Asendia","Asendia APAC","Asendia UK","Asendia USA","ASIGNA","ASMGLS Spain","Au Express","Austrian Post Express","Austrian Post Registered","Averitt Express","B2C Europe","BDMnet","Belpost","Bert Transport","Best Way Parcel","Better Trucks","Bulgarian Posts","JP BH Posta","BirdSystem","Blink","Bluecare Express Ltd","Blue Star","Blue Express","Bneed","Bombino Express Pvt Ltd","Bond","Bonds Couriers","Border Express","Boxberry","BoxC","Bpost international","Brazil Correios","Bring","Brouwer Transport en Logistiek BV","BRT BartoliniParcel ID","BRT BartoliniSender Reference","CAE Delivers","Cainiao","Cambodia Post","Canada Post","Canpar Courier","Capital Transport","Carriers","CarryFlap Co","CDEK","CDEK TR","Cello Square","Ceska Posta","CEVA LOGISTICS","CFL Logistics","CGS Express","Champion Logistics","China EMS ePacket","China Post","Chit Chats","Choir Express Indonesia","Chronopost PortugalDPD","CityLink Express","CJ GLS","CJ Logistics InternationalHong Kong","CJ Korea Express","CJ Century International","CJ Transnational Philippines","CJ Logistics International","CJ Packet","CL ELogistics Solutions Limited","Clevy Links","Cloudwish Asia","CN Logistics","ZYEX","CNE Express","cnwangtong","Colis Prive","Colissimo","CollectCo","Collect","MDS Collivery Pty Ltd","ComOne Express","CometTech","Conway Freight","Continental","Copa Airlines Courier","Cope Sensitive Freight","Correo Uruguayo","Correos de Mexico","Cosmetics Now","Courant Plus","Urbanfox","Courier Plus","Courier IT","CourierPost","Couriers Please","cPacket","Captain Express International","CRL Express","Croshot","CSE","CTC Express","Cubyn","Cuckoo Express","Cyprus Post","Daeshin","DAI Post","Daiichi Freight System Inc","Shanghai Aqrum Chemical Logistics CoLtd","PostNord Denmark","Danniao","Danske Fragtmaend","Dawn Wing","Day and Ross","Dayton Freight","DB Schenker B2B","DB Schenker","DB Schenker Sweden","DD Express Courier","DealerSend","DeliveriT","deliverE","DELIVERYONTIME LOGISTICS PVT LTD","Deliver Your Parcel","Delnext","Deltec Courier","Innovel","Deutsche Post Mail","DEXI","DHL Active Tracing","DHL Benelux","DHL Freight","Deutsche Post DHL","DHL Hong Kong","DHL Netherlands","DHL Express Piece ID","DHL Poland Domestic","DHL Supply Chain APAC","DHL Supply Chain Indonesia","DHL Parcel Spain","DHL Parcel NL","DHL Parcel Russia","DHL Parcel UK","Diamond Eurogistics Limited","GLS Logistic Systems Canada LtdDicom","DIDADI Logistics tech","Dimerco Express Group","Directlog","Direx","DMF","DobroPost","Doora Logistics","DPD Germany","DPD HK","DPD Ireland","DPD Poland","DPD Romania","DPE Express","DPE South Africa","DPEX","DSV","DTD Express","DTDC India","DTDC Australia","DTDC Express Global PTE LTD","DX Freight","Daylight Transport","Dynamic Logistics","Easy Mail","Chukou1","Ecargo","ECexpress","Echo","ECMS International Logistics Co","Ecom Express","ECOSCOOTING","eCoutier","EFS Ecommerce Fulfillment Service","Ekart","Yilian Elian Supply Chain","ELTA Hellenic Post","Emirates Post","EMPS Express","Endeavour Delivery","Envialia","Envialia Reference","eParcel Korea","ePost Global","Equick China","Top Ideal Express","Eshipping","Etomars","eTotal Solution Limited","RETS express","EU Fleet Solutions","Eurodis","EWE Global Express","DPD France formerly exapaq","Expeditors","Expresssale","FAR international","FarGood","Fastbox","Fastrak Services","Fasttrack","Fastway Ireland","Fastway New Zealand","Fastway South Africa","FDSEXPRESS","FedEx Cross Border","FedEx International MailService","FedEx Freight","FedEx UK","FERCAM Logistics and Transport","Fiege Logistics","Fiege Netherlands","First Flight Couriers","FirstMile","Flyt Express","FMX","Fast and Furious","Fonsen Logistics","forrun Pvt Ltd Arpatech Venture","Forward Air","Freightquote by CH Robinson","Frete Rapido","Fulfilla","Fulfillmen","Furdeco","GANGBAO Supplychain","GBA Services Ltd","GBSBroker","GDEX","Geis CZ","Gel Express Logistik","GEM Worldwide","GEODIS  Distribution and Express","GESWL Express","Giao hAng nhanh","Tai Wan Global Business","GlobalTranz","Globavend","Globegistics Inc","GLS","GLS Croatia","GLS Czech Republic","GLS General Logistics Systems Slovakia sro","GLS Slovenia","Dependable Supply Chain Services","Global Post","GoJavas","Go Rush","Greyhound","Grupo ampm","GSI EXPRESS","GSOGLSUSA","HanJin","HCT LOGISTICS COLTD","Haidaibao","Haidaibao BOX","Hellenic Greece Post","Hellmann Worldwide Logistics","Heppner Internationale Spedition GmbH and Co","Heppner France","Hermesworld","Hermes Einrichtungs Service GmbH and Co KG","HR Parcel","Hero Express","HFD","Hua Han Logistics","Hipshipper","HKD International Logistics","Holisol","Home Delivery Solutions Ltd","Hong Kong Post","Hound Express","Hrvatska Posta","HSDEXPRESS","HuanTong","Huodull","HX Express","idika","iparcel","Beone Logistics","IDEX","iDexpress Indonesia","IML","IMX Mail","India Post Domestic","India Post International","INDOPAKET","InPost Paczkomaty","InPost","IntelValley Supply chain ShenZhen Co Ltd","Intelipost TMS for LATAM","DPD Local","DPD Local reference","Interparcel Australia","Interparcel New Zealand","Interparcel UK","INTEX Paketdienst GmbH","Internet Express","Israel Post","Israel Post Domestic","Italy SDA","J Net","Jam Express","Janco Ecommerce","Janio Asia","Japan Post","Jayon Express JEX","JCEX","JD Worldwide","Jersey Post","JetShip Worldwide","JINSUNG TRADING","Jocom","Joom Logistics","Joying Box","JS EXPRESS","JandT CARGO","JandT EXPRESS MALAYSIA","JandT Express Vietnam","JX","K1 Express","Kangaroo Worldwide Express","KargomKolay CargoMini","Kyungdong Parcel","KEC","KedaEX","Kerry eCommerce","Kerry Express Thailand","Kerry TJ Logistics","Kerry Express Vietnam Co Ltd","KGM Hub","Kuehne Nagel","Keuhne Nagel Global","Komon Express","Korea Post EMS","Korea Post","KURASI","KWE Global","Shenzhen Jinghuada Logistics Co","Kua Yue Express","La Poste","Lao Post","Latvijas Pasts","Leader","Legion Express","LexShip","LHT Express","LICCARDI EXPRESS COURIER","liefery","Lietuvos Pastas","Line Clear Express and Logistics Sdn Bhd","Link BridgeBeiJinginternational logistics co","Lion Parcel","Logisters","Logwin Logistics","Lone Star Overnight","Loomis Express","Lotte Global Logistics","LTL","Logistic Worldwide Express","M Xpress Sdn Bhd","M3 Logistics","MailAmericas","MailPlus","MailPlus Japan","Mainfreight","Mainway","Malaysia Post EMS  Pos Laju","Malaysia Post  Registered","Matdespatch","Matkahuolto","MBW Courier Inc","Meest","Mexico Redpack","Mexico Senda Express","PT MGLOBAL LOGISTICS INDONESIA","Mhi","Mikropakket","Mikropakket Belgium","Milkman","MISUMI Group Inc","Mobi Logistica","Mondial Relay","Morelink","Morning Express","MRW","MUDITA","MandX cargo","My DynaLogic","NACEX","NACEX Spain","Nanjing Woyuan","National Sameday","Nationwide Express","NZ Post","Newegg Express","Newgistics","Newgistics API","New Zealand Couriers","Nhans Solutions","Nightline","Nim Express","NimbusPost","Ninja Van Indonesia","Ninja Van Malaysia","Ninja Van Thailand","NiPost","NandM Transfer Co","Norsk Global","Nova Poshta International","NOX NightTimeExpress","Nhat Tin Logistics","NYT SUPPLY CHAIN LOGISTICS Co","OCA Argentina","OCS ANA Group","OCS WORLDWIDE","OkayParcel","Old Dominion Freight Line","Omni Parcel","One click delivery services","One World Express","OnTrac","FedEx Poland Domestic","Overseas Express","PACKFLEET","Packlink","PAL Express Limited","The Pallet Network","Palletways","PanAsia International","Pandu Logistics","Panther","Paper Express","Paquetexpress","Parcel Force","Parcel2Go","Parcelink Logistics","Parcelledin","PARCEL ONE","ParcelPoint Pty Ltd","Parcel Post Singapore","Parcel Right","Parcel To Post","CIRRO ECommerce","Park N Parcel","PFC Express","Pickrr","Pickupp","PICK UPP","PICK UPP Singapore","Pidge","PIL Logistics China Co","Pilot Freight Services","Pitney Bowes","PITT OHIO","Planzer Group","Poczta Polska","Pony express","Portugal CTT","Portugal Seur","Pos Indonesia Domestic","Post Serbia","Post of Slovenia","Post56","Posta Romana","Posta Plus","Poste Italiane","Poste Italiane Paccocelere","Posten Norge  Bring","PostNL Domestic","PostNL International 3S","PostNL International","PostNord Logistics","Post ONE","PostPlus","Iceland Post","PayPal Package","Pressio","Professional Couriers","ProMed Delivery","PTS","PTT Posta","Purolator","Quantium","Qwintry Logistics","Qxpress","Raben Group","RAF Philippines","RaidereX","RAM","Red Carpet Logistics","Redur Spain","Rhenus Logistics","Rincos","RL Carriers","Roadbull Logistics","Rocket Parcel International","RoyalShipments","RPD2man Deliveries","RPX Logistics","RPX Online","Russian Post","Ruston","RZY Express","Safexpress","SAILPOST SPA","SAP EXPRESS","South African Post Office","Saudi Post","Sber Logistics","Scudex Express","Southeastern Freight Lines","Sending Transporte Urgente y Comunicacion","Sendit","Sendle","Setel Express","SF Express China","SF International","SFC","SFCSendfromChina","Shadowfax","Ship It Asia","ShipEntegra","ShipGate","Shippit","Shiprocket X","SHIPTER","Westgate Global","ShopfansRU LLC","Olive","SENHONG INTERNATIONAL LOGISTICS","Shree Maruti Courier Services Pvt Ltd","Shree Anjani Courier","SHREE NANDAN COURIER","SHREE TIRUPATI COURIER SERVICES PVT LTD","Shypmax","JandT Express Singapore","Singapore Post","Singapore Speedpost","Sin Global Express","Sinotrans","Siodemka","Slovenska posta","SkyPostal","SKYBOX","SkyNet Malaysia","Skynet World Wide Express South Africa","SkyNet Worldwide Express","SkyNet Worldwide Express UAE","Skynet Worldwide Express UK","SMARTCAT","Smooth Couriers","Sonic Transportation and Logistics","Correos de Espana","Specialised Freight","Speed Couriers","SpeeDee Delivery","SPEEDEX","SPOTON Logistics Pvt Ltd","Spring GDS","SPRINT PACK","Shopee Express","Shopee Xpress","SRE Korea","SRT Transport","Stallion Express","Star Track Courier","Star Track Express","STARKEN","Stat Overnight","STEP FORWARD FREIGHT SERVICE CO LTD","STO Express","STONE3PL","Streck Transport","Sutton Transport","PostNord Sweden","Swiship","Sunyou Post","DPEX China","SZENDEX","Taiwan Post","TAQBIN Hong Kong","Yamato Japan","PRESIDENT TRANSNET CORP","TONDA GLOBAL","Geniki Taxydromiki","Tazmanian Freight Systems","TCK Express","Testing Courier","TFM Xpress","TForce Final Mile","Kerry Express Hong Kong","Thabit Logistics","Thailand Thai Post","TP Logistic","The Courier Guy","TDG The Delivery Group","TIG Freight","Tiki","TNT","TNT Australia","TNTClick Italy","TNT France","TNT Italy","TNT Reference","TNT UK","TNT UK Reference","Toll IPEC","Toll New Zealand","Team Global Express","Tolos","Tophatter Express","TopYou","CTT Express","Trackon Couriers Pvt Ltd","P2P TrakPak","Trans Kargo Internasional","Trans2u","TransMission","TRUMPCARD LLC","Tuffnells Parcels Express","Tuffnells Parcels Express Reference","UBI Smart Parcel","ucexpress","UCS","United Delivery Service","UK Mail","UkrPoshta","UPS Freight","UPS Mail Innovations","UPS Reference","USF Reddaway","uShip","Venipak","ViaEurope","ViettelPost","VIWO IoT","VicTas Freight Express","Wahana","WanbExpress","Weaship","WeDo Logistics","WePost Sdn Bhd","We World Express","Whistl","Wise Express","Wiseloads","WishPost","Wizmo","wnDirect","Worldnet Logistics","XDP Express","XDP Express Reference","XL Express","Xpert Delivery","XPO","Xpostph","XpressBees","Xpressen","XQ Express","Xingyunyi Logistics","Yakit","Yanwen","Shenzhen 1st International LogisticsGroupCo","YDH express","YiFan Express","Yodel International","Yodel Direct","YRC","YTO Express","Yunda Express","YunExpress","Yurtici Kargo","HUAHANG EXPRESS","YYEXPRESS","Zajil Express Company","Zeleris","Eshun international Logistic","Ziing","Zinc","ZJS International","ZTO Express China","ZTO Express Global","DMSMatrix","Go People","HUBBED","Panther Order Number","Sims Global","Transport Ambientales","Georgian Post","GO Logistics and Storage","Luwjistik","UENVIOS","BUFFALO","ACI Logistix","Morning Global","FRONTdoor Collective","TransVirtual","Quiet Platforms","Burd Delivery Aps","Pandion","TYP","ICS COURIER","ShunBang Express","ViaXpress","XGS","uParcel","Tomydoor","Plycon Transportation Group","FlipXpress","Northline","Crossflight Limited","Ozeparts Shipping","QTrack","Fast Despatch Logistics Limited","Fastship Express","Optima Courier","FUJIE EXPRESS","iThink Logistics","Cago","Eco Freight","Tusk Logistics","EMS","DeliverDirect","Servientrega","Trusk France","INTERSMARTTRANS and SOLUTIONS SL","JandT Express Philippines","Movianto","Thunder Express Australia","Flight Logistics Group","SHIPXPRESS","ADS Express","Big Smart","Med Africa Logistics","Packeta","Pakajo World","Sppedaf Express","Cacesa","Asyad Express","EasyRoutes","EXPRESSONE","GC Express","TDN","Early Bird","Swiship JP","Bringer Parcel Services","SpeedX","SkyExpress Internationals","Swiss Universal Express","Associate Global Systems","American West","Ninjavan Vietnam","Castle Parcels","Spediscionline","DIR","AICS","Super Pac Line","DOMINO","GLS USA","Paikeda","LogoiX","upschecker","RPM","Urbit","Go Bolt","hepsiJET","Grand Slam Express","LIEFERGRUN","SG LINK","Packaly","packman","eShipper","Multientrega","Welivery","GLS Romania","Urbify","eTower","GTA GSM","Yunant","Sky King","Maergo","Transpak Inc","Aoyue","shopline","Easyparcel","Team Express Service LLC","Kinisi Transport Pty Ltd","Navlungo","LM Parcel","Sendy Express","Discount Post","Jawar","FleetOptics","ShipGlobal","Southwestern Motor Transport Inc","ATA","Madrooex","Yunhuipost","Oakh Harbour Freight Lines","Zoom","PIGGYSHIP","Go For GPS","DPD Portugal","Barsan Global Lojistik","Asendia Global","Kolay Gelsin","MNG Kargo","PTT Kargo","Scotty","PackUp","Surat Kargo","Sendeo Kargo","OTS","Leman","xmszm","YouParcel","Xindus","Moovin","Rivo","Allied Express","Grupo logistico Andreani","AO Logistics","Aramex","ATS Healthcare","Australia Post","Jitsu","BJS Distribution","Bluedart","Bollore Logistics","Bpost","BRT Bartolini","CBL Logistica","Chronopost France","Coordinadora","Correos Express","DACHSER","Delhivery","Destiny Transportation","Detrack","DHL Express","DHL Spain Domestic","DHL eCommerce Solutions","DHL eCommerce Asia","DHL Supply Chain Australia","Dialogo Logistica","Direct Couriers","DPD","DPD Hungary","DPD Russia","DPD UK","DX","Estafeta","Aramex Australia","Flash Express","GatiKWE","Go Express and logistics","GIO Express Inc","GLS Italy","GLS Netherlands","Helthjem","Hermes Germany","Hunter Express","iCumulus","International Seur","JNE","Kronos Express","Lalamove","Landmark Global","LaserShip","MalcaAmit","EVRi","Nationex","Ninja Van","Nippon Express","Nova Poshta","Innight Express Germany GmbH nox NachtExpress","Omniva","Orange Connex","OrangeDS Orange Distribution Solutions Inc","OSM Worldwide","Panther Reference","PFL","Posti","Royal Mail","Sagawa","Seino","SEKO Logistics","SF Express","ShipX","SMSA Express","Spanish Seur","StarTrack","Swiss Post","Yamato Singapore","TCS","TIPSA","Total Express","USPS","VIR Transport","Vietnam Post","Yodel Domestic","Yusen Logistics","CDL Last Mile","DPD Netherlands","GDPharm Logistics","GLS Spain","Packs","Payo","Quiqup","Sherpa","Czech Post","Metropolitan Warehouse and Delivery","Rhenus Logistics UK","Trunkrs","WeShip","Wineshipping","DHL Global Forwarding eCommerce","DPD Austria","Parcelstars","Tcat","GLS Hungary","Vesyl","Celeritas Transporte","Concise","DB Schenker Iceland","Deliverr","DHL Global Forwarding","First Logistics","GIG","LBC Express","Magyar Posta","Rixon Logistics","99minutos","Ader","Aras Cargo","Barq","BandH Worldwide","Bomi Group","CEVA Package","Chazki","Chile Express","DAO365","DHL Reference number","DHL supply chain India","Direct Freight Express","DKSH","DNJ Express","DSV Futurewave","DX B2B","Elite Express","FAN COURIER EXPRESS","Faxe Cargo","Fetchr","Glovo","Gebruder Weiss","Home Logistics","HSM Global","Ilyang logistics","Inexpost","Javit","Livrapide","Loggi","Logysto","Mail Boxes Etc","Marken","Groupe Mazet","MNX","Mondial Relay SpainPunto Pack","Mondial Relay France","Moova","Naqel Express","NTL logistics","Passport Shipping","Patheon Logistics","PolarSpeed Inc","Professional Parcel Logistics","Pro Carrier","Purolator International","Red je Pakketje","Relais Colis","SHIPA","Shippie","Shippify","Teliway SIC Express","Spectran","Speedy","Thijs Logistiek","Tipsa Reference","TNT France Reference","Tourline Express","Urgent Cargus","VOX SOLUCION EMPRESARIAL SRL","World Courier","WSP Express","Xpedigo","Zeek2Door","Activos24","AFL LOGISTICS","Agediss","Airmee","Argents Express Group","BioCair","Budbee","City Express","ClickLink","Corporate Couriers","CryoPDP","The Custom Companies","Designer Transport","DoorDash","DPD Switzerland","DPD Slovakia","East West Courier Pte Ltd","Eurodifarm","Estes Forwarding Worldwide","Europacket","Exelot Ltd","Expeditors API Reference","fairsenden","FitzMark","FragilePAK","GAC","Gojek","Grab","Hermes UK","Inntralog GmbH","Instabox","Integra2","InTime","Ivoy","Kerry Logistics","LCT do Brasil","Locus","TandW Delivery","Mensajeros Urbanos","Naeko Logistics","Novofarma","Sequoialog","Omni Returns","Paack","Pandago","ParcelPal","USPS Flats Pitney Bowes","Pgeon","Product Care Services Limited","Quickstat Courier LLC","Routific","SerVIP","SimpleTire","solistica","Spreetail","SortHub","Tonami","Uber","USPS Informed Visibility","Value Logistics","Ximex Delivery Express","D Express","Best Transport","OM LOGISTICS LTD","iMile","Kiitajat","Ransa","Tamer Logistics","AIT","Teleport","Snt Global Etrax","DHL GLOBAL FORWARDING PANAMA","DHL Global Forwarding Guatemala","Kerry Express TaiWan","mySendle","Chienventure","Papa","IB Venture","Secretlab","Mothership","Starlinks Global","Zuellig Pharma Korea","WOO YOUNG LOGISTICS CO","PHSE","Roche Internal Courier","DHL IE","ANC  Fleets Flyers PTY LTD","Veho","Arrow","C Chez Vous","Rendr","Kiwi Express Couriers","Zoom2U","Jumppoint","transoflex Express GmbH and Co KGaA","Fliway","Stop Start Transport Ltd","Fukuyama","SIGNIA LOGISTICS SAC","Borderless 360","Mobile Tyre Shop","DashLink","Bleckmann","M24 Logistics","XPO Last Mile France","Boxcheck","5Stringsolutions","Cargo Partner","On Way","Flash Express PH","Geodis MyParcel","Skelton","chronodiali","Alpha Freight","Ekol Lojistik","Courier Network Inc","Returnmates","TASCO BERHAD","Porter Express","Fastway Australia","UNITED CALIFORNIA FREIGHT SOLUTIONS","Toshi","BTX GLOBAL LOGISTICS","NTI Logistics","Sassy","P2P Delivery Ltd","Parcel Delivery Network","ecourier MDS","HTDK Shanghai","Parca Logistics","RXO","DSV UAE","Lalamove Plus","Road Runner Freight","MVL","SKY2C FREIGHT SYSTEMS INC","Yellow Diamond Logistics","SDS Logistics","POLARIS TRANSPORT CARRIERS INC","ABF","MAVINC","NACHOS TRANSPORTATION LLC","LUCAS TRUCKING LLC","EDI Express","Mountain Valley Express","A TRUCK EXPRESS","SAIA","Other"] },
        { apiName: "cf_carrier", label: "Carrier", type: "text" },
        { apiName: "cf_pro_number", label: "Pro Number", type: "text" },
        { apiName: "cf_bol", label: "BOL", type: "text" },
        { apiName: "cf_pick_up_ref_number", label: "Pickup Ref Number", type: "text" },
        { apiName: "cf_estimated_trucking_cost", label: "Estimated Trucking Cost", type: "currency" },
        { apiName: "cf_pickup_schedule_time", label: "Pickup Schedule Time", type: "datetime" },
        { apiName: "cf_pickup_time", label: "ETA for Pickup", type: "datetime" },
        { apiName: "cf_pickup_date", label: "Pickup Date", type: "datetime" },
        { apiName: "cf_eta_at_warehouse", label: "ETA at Warehouse", type: "datetime" },
        { apiName: "cf_on_hand_date", label: "On-Hand Date", type: "datetime" },
        { apiName: "cf_on_hand_details", label: "On-Hand Details", type: "textarea" },
      ],
    },
  ],
};

const DISPATCH_TO_PORT_LAYOUT: ZohoLayout = {
  name: "Dispatch to Port",
  zohoLayoutId: "145882000113927712",
  sections: [
    {
      title: "Ticket Information",
      fields: [
        { apiName: "cf_ref_number", label: "Ref Number", type: "text" },
        { apiName: "cf_shipment_type_1", label: "Shipment Type", type: "picklist", options: ["Non Consolidation","Clubbed Shipment","Consolidation Service"] },
        { apiName: "cf_send_to_vhaul", label: "Send to Vhaul", type: "boolean" },
      ],
    },
    {
      title: "Dispatch Instructions",
      fields: [
        { apiName: "cf_origin", label: "Origin Port", type: "text" },
        { apiName: "cf_destination", label: "Destination Port", type: "text" },
        { apiName: "cf_shipper_1", label: "Shipper", type: "picklist", options: ["Known","Unknown","Yet to Confirm"] },
        { apiName: "cf_quote_amount_1", label: "Quote Amount", type: "currency" },
        { apiName: "cf_quote_basis", label: "Quote Basis", type: "picklist", options: ["Flat","Per Kg"] },
        { apiName: "cf_quoted_by", label: "Quoted By", type: "text" },
        { apiName: "cf_pallets_x_dimensions", label: "Pallets x Dimensions", type: "textarea" },
        { apiName: "cf_gross_weight", label: "Gross Weight", type: "decimal" },
        { apiName: "cf_volumetric_weight", label: "Volumetric Weight", type: "decimal" },
        { apiName: "cf_chargeable_weight", label: "Chargeable Weight", type: "decimal" },
        { apiName: "cf_commodity_detail", label: "Commodity Detail", type: "text" },
        { apiName: "cf_stackable_and_turnable", label: "Stackable and Turnable", type: "multiselect", options: ["Stackable","Turnable","Non-Stackable"] },
        { apiName: "cf_service_type", label: "Service Type", type: "picklist", options: ["Door to Door","Door to Port","Port to Port","Port to Door"] },
        { apiName: "cf_trucking_by", label: "Shipment Terms", type: "picklist", options: ["EXW","FCA","CPT","CIP","DAP","DPU","DDP","FAS","FOB","CFR","CIF"] },
      ],
    },
    {
      title: "Pickup Instructions",
      fields: [
        { apiName: "cf_pickup_location", label: "Pickup Location", type: "text" },
        { apiName: "cf_contact_details", label: "Contact Details", type: "textarea" },
        { apiName: "cf_location_type", label: "Location Type", type: "picklist", options: ["Residential","Commercial"] },
        { apiName: "cf_dock_hours", label: "Dock Hours", type: "text" },
        { apiName: "cf_variable_2", label: "SO Number", type: "text" },
        { apiName: "cf_preferred_pickup_date", label: "Preferred Pickup Date", type: "datetime" },
        { apiName: "cf_pickup_instructions", label: "Pickup Instructions", type: "textarea" },
      ],
    },
    {
      title: "Dispatch Operations",
      fields: [
        { apiName: "cf_dispatch_route", label: "Dispatch Route", type: "picklist", options: ["Via Warehouse","Direct to Port"] },
        { apiName: "cf_port_drop_location", label: "Port Drop Location", type: "text" },
        { apiName: "cf_drop_cut_off_time", label: "Drop Cut Off Time", type: "datetime" },
        { apiName: "cf_carrier_picklist", label: "Carrier-Name", type: "picklist", options: ["Vhaul4u","Saia LTL Freight","Roadrunner Transport Service","Fedex","UPS","Estes","17 Post Service","2ebox","2GO","360 Lion Express","3JMS Logistics","472 Entregando","4PX","Best Express","A1Post","A2B Express Logistics","AAA Cooper","ABF Freight","ABX Express","aCommerce","ACS Courier","ACS Worldwide Express","Adicional Logistics","ADSOne","A Duie Pyle","Mexico AeroFlash","Aeronet","AEX Group","Agility","AIR21","Airpak Express","Airspeed International Corporation","ALLJOY SUPPLY CHAIN CO","alphaFAST","Always Express","Amazon Shipping Amazon MCF","Amazon","Swiship UK","Swiship DE","Swiship IN","Amazon order","Amazon Shipping","AMS Group","An Post","Anicam Global","Anjun","ANSERX","Anteraja","AO Deutschland Ltd","APC Postal Logistics","APC Overnight","APC Overnight Consignment Number","APG eCommerce Solutions Ltd","Aquiline","Arco Spedizioni SP","ARK Logistics","Arrow XL","ASE KARGO","Asendia","Asendia APAC","Asendia UK","Asendia USA","ASIGNA","ASMGLS Spain","Au Express","Austrian Post Express","Austrian Post Registered","Averitt Express","B2C Europe","BDMnet","Belpost","Bert Transport","Best Way Parcel","Better Trucks","Bulgarian Posts","JP BH Posta","BirdSystem","Blink","Bluecare Express Ltd","Blue Star","Blue Express","Bneed","Bombino Express Pvt Ltd","Bond","Bonds Couriers","Border Express","Boxberry","BoxC","Bpost international","Brazil Correios","Bring","Brouwer Transport en Logistiek BV","BRT BartoliniParcel ID","BRT BartoliniSender Reference","CAE Delivers","Cainiao","Cambodia Post","Canada Post","Canpar Courier","Capital Transport","Carriers","CarryFlap Co","CDEK","CDEK TR","Cello Square","Ceska Posta","CEVA LOGISTICS","CFL Logistics","CGS Express","Champion Logistics","China EMS ePacket","China Post","Chit Chats","Choir Express Indonesia","Chronopost PortugalDPD","CityLink Express","CJ GLS","CJ Logistics InternationalHong Kong","CJ Korea Express","CJ Century International","CJ Transnational Philippines","CJ Logistics International","CJ Packet","CL ELogistics Solutions Limited","Clevy Links","Cloudwish Asia","CN Logistics","ZYEX","CNE Express","cnwangtong","Colis Prive","Colissimo","CollectCo","Collect","MDS Collivery Pty Ltd","ComOne Express","CometTech","Conway Freight","Continental","Copa Airlines Courier","Cope Sensitive Freight","Correo Uruguayo","Correos de Mexico","Cosmetics Now","Courant Plus","Urbanfox","Courier Plus","Courier IT","CourierPost","Couriers Please","cPacket","Captain Express International","CRL Express","Croshot","CSE","CTC Express","Cubyn","Cuckoo Express","Cyprus Post","Daeshin","DAI Post","Daiichi Freight System Inc","Shanghai Aqrum Chemical Logistics CoLtd","PostNord Denmark","Danniao","Danske Fragtmaend","Dawn Wing","Day and Ross","Dayton Freight","DB Schenker B2B","DB Schenker","DB Schenker Sweden","DD Express Courier","DealerSend","DeliveriT","deliverE","DELIVERYONTIME LOGISTICS PVT LTD","Deliver Your Parcel","Delnext","Deltec Courier","Innovel","Deutsche Post Mail","DEXI","DHL Active Tracing","DHL Benelux","DHL Freight","Deutsche Post DHL","DHL Hong Kong","DHL Netherlands","DHL Express Piece ID","DHL Poland Domestic","DHL Supply Chain APAC","DHL Supply Chain Indonesia","DHL Parcel Spain","DHL Parcel NL","DHL Parcel Russia","DHL Parcel UK","Diamond Eurogistics Limited","GLS Logistic Systems Canada LtdDicom","DIDADI Logistics tech","Dimerco Express Group","Directlog","Direx","DMF","DobroPost","Doora Logistics","DPD Germany","DPD HK","DPD Ireland","DPD Poland","DPD Romania","DPE Express","DPE South Africa","DPEX","DSV","DTD Express","DTDC India","DTDC Australia","DTDC Express Global PTE LTD","DX Freight","Daylight Transport","Dynamic Logistics","Easy Mail","Chukou1","Ecargo","ECexpress","Echo","ECMS International Logistics Co","Ecom Express","ECOSCOOTING","eCoutier","EFS Ecommerce Fulfillment Service","Ekart","Yilian Elian Supply Chain","ELTA Hellenic Post","Emirates Post","EMPS Express","Endeavour Delivery","Envialia","Envialia Reference","eParcel Korea","ePost Global","Equick China","Top Ideal Express","Eshipping","Etomars","eTotal Solution Limited","RETS express","EU Fleet Solutions","Eurodis","EWE Global Express","DPD France formerly exapaq","Expeditors","Expresssale","FAR international","FarGood","Fastbox","Fastrak Services","Fasttrack","Fastway Ireland","Fastway New Zealand","Fastway South Africa","FDSEXPRESS","FedEx Cross Border","FedEx International MailService","FedEx Freight","FedEx UK","FERCAM Logistics and Transport","Fiege Logistics","Fiege Netherlands","First Flight Couriers","FirstMile","Flyt Express","FMX","Fast and Furious","Fonsen Logistics","forrun Pvt Ltd Arpatech Venture","Forward Air","Freightquote by CH Robinson","Frete Rapido","Fulfilla","Fulfillmen","Furdeco","GANGBAO Supplychain","GBA Services Ltd","GBSBroker","GDEX","Geis CZ","Gel Express Logistik","GEM Worldwide","GEODIS  Distribution and Express","GESWL Express","Giao hAng nhanh","Tai Wan Global Business","GlobalTranz","Globavend","Globegistics Inc","GLS","GLS Croatia","GLS Czech Republic","GLS General Logistics Systems Slovakia sro","GLS Slovenia","Dependable Supply Chain Services","Global Post","GoJavas","Go Rush","Greyhound","Grupo ampm","GSI EXPRESS","GSOGLSUSA","HanJin","HCT LOGISTICS COLTD","Haidaibao","Haidaibao BOX","Hellenic Greece Post","Hellmann Worldwide Logistics","Heppner Internationale Spedition GmbH and Co","Heppner France","Hermesworld","Hermes Einrichtungs Service GmbH and Co KG","HR Parcel","Hero Express","HFD","Hua Han Logistics","Hipshipper","HKD International Logistics","Holisol","Home Delivery Solutions Ltd","Hong Kong Post","Hound Express","Hrvatska Posta","HSDEXPRESS","HuanTong","Huodull","HX Express","idika","iparcel","Beone Logistics","IDEX","iDexpress Indonesia","IML","IMX Mail","India Post Domestic","India Post International","INDOPAKET","InPost Paczkomaty","InPost","IntelValley Supply chain ShenZhen Co Ltd","Intelipost TMS for LATAM","DPD Local","DPD Local reference","Interparcel Australia","Interparcel New Zealand","Interparcel UK","INTEX Paketdienst GmbH","Internet Express","Israel Post","Israel Post Domestic","Italy SDA","J Net","Jam Express","Janco Ecommerce","Janio Asia","Japan Post","Jayon Express JEX","JCEX","JD Worldwide","Jersey Post","JetShip Worldwide","JINSUNG TRADING","Jocom","Joom Logistics","Joying Box","JS EXPRESS","JandT CARGO","JandT EXPRESS MALAYSIA","JandT Express Vietnam","JX","K1 Express","Kangaroo Worldwide Express","KargomKolay CargoMini","Kyungdong Parcel","KEC","KedaEX","Kerry eCommerce","Kerry Express Thailand","Kerry TJ Logistics","Kerry Express Vietnam Co Ltd","KGM Hub","Kuehne Nagel","Keuhne Nagel Global","Komon Express","Korea Post EMS","Korea Post","KURASI","KWE Global","Shenzhen Jinghuada Logistics Co","Kua Yue Express","La Poste","Lao Post","Latvijas Pasts","Leader","Legion Express","LexShip","LHT Express","LICCARDI EXPRESS COURIER","liefery","Lietuvos Pastas","Line Clear Express and Logistics Sdn Bhd","Link BridgeBeiJinginternational logistics co","Lion Parcel","Logisters","Logwin Logistics","Lone Star Overnight","Loomis Express","Lotte Global Logistics","LTL","Logistic Worldwide Express","M Xpress Sdn Bhd","M3 Logistics","MailAmericas","MailPlus","MailPlus Japan","Mainfreight","Mainway","Malaysia Post EMS  Pos Laju","Malaysia Post  Registered","Matdespatch","Matkahuolto","MBW Courier Inc","Meest","Mexico Redpack","Mexico Senda Express","PT MGLOBAL LOGISTICS INDONESIA","Mhi","Mikropakket","Mikropakket Belgium","Milkman","MISUMI Group Inc","Mobi Logistica","Mondial Relay","Morelink","Morning Express","MRW","MUDITA","MandX cargo","My DynaLogic","NACEX","NACEX Spain","Nanjing Woyuan","National Sameday","Nationwide Express","NZ Post","Newegg Express","Newgistics","Newgistics API","New Zealand Couriers","Nhans Solutions","Nightline","Nim Express","NimbusPost","Ninja Van Indonesia","Ninja Van Malaysia","Ninja Van Thailand","NiPost","NandM Transfer Co","Norsk Global","Nova Poshta International","NOX NightTimeExpress","Nhat Tin Logistics","NYT SUPPLY CHAIN LOGISTICS Co","OCA Argentina","OCS ANA Group","OCS WORLDWIDE","OkayParcel","Old Dominion Freight Line","Omni Parcel","One click delivery services","One World Express","OnTrac","FedEx Poland Domestic","Overseas Express","PACKFLEET","Packlink","PAL Express Limited","The Pallet Network","Palletways","PanAsia International","Pandu Logistics","Panther","Paper Express","Paquetexpress","Parcel Force","Parcel2Go","Parcelink Logistics","Parcelledin","PARCEL ONE","ParcelPoint Pty Ltd","Parcel Post Singapore","Parcel Right","Parcel To Post","CIRRO ECommerce","Park N Parcel","PFC Express","Pickrr","Pickupp","PICK UPP","PICK UPP Singapore","Pidge","PIL Logistics China Co","Pilot Freight Services","Pitney Bowes","PITT OHIO","Planzer Group","Poczta Polska","Pony express","Portugal CTT","Portugal Seur","Pos Indonesia Domestic","Post Serbia","Post of Slovenia","Post56","Posta Romana","Posta Plus","Poste Italiane","Poste Italiane Paccocelere","Posten Norge  Bring","PostNL Domestic","PostNL International 3S","PostNL International","PostNord Logistics","Post ONE","PostPlus","Iceland Post","PayPal Package","Pressio","Professional Couriers","ProMed Delivery","PTS","PTT Posta","Purolator","Quantium","Qwintry Logistics","Qxpress","Raben Group","RAF Philippines","RaidereX","RAM","Red Carpet Logistics","Redur Spain","Rhenus Logistics","Rincos","RL Carriers","Roadbull Logistics","Rocket Parcel International","RoyalShipments","RPD2man Deliveries","RPX Logistics","RPX Online","Russian Post","Ruston","RZY Express","Safexpress","SAILPOST SPA","SAP EXPRESS","South African Post Office","Saudi Post","Sber Logistics","Scudex Express","Southeastern Freight Lines","Sending Transporte Urgente y Comunicacion","Sendit","Sendle","Setel Express","SF Express China","SF International","SFC","SFCSendfromChina","Shadowfax","Ship It Asia","ShipEntegra","ShipGate","Shippit","Shiprocket X","SHIPTER","Westgate Global","ShopfansRU LLC","Olive","SENHONG INTERNATIONAL LOGISTICS","Shree Maruti Courier Services Pvt Ltd","Shree Anjani Courier","SHREE NANDAN COURIER","SHREE TIRUPATI COURIER SERVICES PVT LTD","Shypmax","JandT Express Singapore","Singapore Post","Singapore Speedpost","Sin Global Express","Sinotrans","Siodemka","Slovenska posta","SkyPostal","SKYBOX","SkyNet Malaysia","Skynet World Wide Express South Africa","SkyNet Worldwide Express","SkyNet Worldwide Express UAE","Skynet Worldwide Express UK","SMARTCAT","Smooth Couriers","Sonic Transportation and Logistics","Correos de Espana","Specialised Freight","Speed Couriers","SpeeDee Delivery","SPEEDEX","SPOTON Logistics Pvt Ltd","Spring GDS","SPRINT PACK","Shopee Express","Shopee Xpress","SRE Korea","SRT Transport","Stallion Express","Star Track Courier","Star Track Express","STARKEN","Stat Overnight","STEP FORWARD FREIGHT SERVICE CO LTD","STO Express","STONE3PL","Streck Transport","Sutton Transport","PostNord Sweden","Swiship","Sunyou Post","DPEX China","SZENDEX","Taiwan Post","TAQBIN Hong Kong","Yamato Japan","PRESIDENT TRANSNET CORP","TONDA GLOBAL","Geniki Taxydromiki","Tazmanian Freight Systems","TCK Express","Testing Courier","TFM Xpress","TForce Final Mile","Kerry Express Hong Kong","Thabit Logistics","Thailand Thai Post","TP Logistic","The Courier Guy","TDG The Delivery Group","TIG Freight","Tiki","TNT","TNT Australia","TNTClick Italy","TNT France","TNT Italy","TNT Reference","TNT UK","TNT UK Reference","Toll IPEC","Toll New Zealand","Team Global Express","Tolos","Tophatter Express","TopYou","CTT Express","Trackon Couriers Pvt Ltd","P2P TrakPak","Trans Kargo Internasional","Trans2u","TransMission","TRUMPCARD LLC","Tuffnells Parcels Express","Tuffnells Parcels Express Reference","UBI Smart Parcel","ucexpress","UCS","United Delivery Service","UK Mail","UkrPoshta","UPS Freight","UPS Mail Innovations","UPS Reference","USF Reddaway","uShip","Venipak","ViaEurope","ViettelPost","VIWO IoT","VicTas Freight Express","Wahana","WanbExpress","Weaship","WeDo Logistics","WePost Sdn Bhd","We World Express","Whistl","Wise Express","Wiseloads","WishPost","Wizmo","wnDirect","Worldnet Logistics","XDP Express","XDP Express Reference","XL Express","Xpert Delivery","XPO","Xpostph","XpressBees","Xpressen","XQ Express","Xingyunyi Logistics","Yakit","Yanwen","Shenzhen 1st International LogisticsGroupCo","YDH express","YiFan Express","Yodel International","Yodel Direct","YRC","YTO Express","Yunda Express","YunExpress","Yurtici Kargo","HUAHANG EXPRESS","YYEXPRESS","Zajil Express Company","Zeleris","Eshun international Logistic","Ziing","Zinc","ZJS International","ZTO Express China","ZTO Express Global","DMSMatrix","Go People","HUBBED","Panther Order Number","Sims Global","Transport Ambientales","Georgian Post","GO Logistics and Storage","Luwjistik","UENVIOS","BUFFALO","ACI Logistix","Morning Global","FRONTdoor Collective","TransVirtual","Quiet Platforms","Burd Delivery Aps","Pandion","TYP","ICS COURIER","ShunBang Express","ViaXpress","XGS","uParcel","Tomydoor","Plycon Transportation Group","FlipXpress","Northline","Crossflight Limited","Ozeparts Shipping","QTrack","Fast Despatch Logistics Limited","Fastship Express","Optima Courier","FUJIE EXPRESS","iThink Logistics","Cago","Eco Freight","Tusk Logistics","EMS","DeliverDirect","Servientrega","Trusk France","INTERSMARTTRANS and SOLUTIONS SL","JandT Express Philippines","Movianto","Thunder Express Australia","Flight Logistics Group","SHIPXPRESS","ADS Express","Big Smart","Med Africa Logistics","Packeta","Pakajo World","Sppedaf Express","Cacesa","Asyad Express","EasyRoutes","EXPRESSONE","GC Express","TDN","Early Bird","Swiship JP","Bringer Parcel Services","SpeedX","SkyExpress Internationals","Swiss Universal Express","Associate Global Systems","American West","Ninjavan Vietnam","Castle Parcels","Spediscionline","DIR","AICS","Super Pac Line","DOMINO","GLS USA","Paikeda","LogoiX","upschecker","RPM","Urbit","Go Bolt","hepsiJET","Grand Slam Express","LIEFERGRUN","SG LINK","Packaly","packman","eShipper","Multientrega","Welivery","GLS Romania","Urbify","eTower","GTA GSM","Yunant","Sky King","Maergo","Transpak Inc","Aoyue","shopline","Easyparcel","Team Express Service LLC","Kinisi Transport Pty Ltd","Navlungo","LM Parcel","Sendy Express","Discount Post","Jawar","FleetOptics","ShipGlobal","Southwestern Motor Transport Inc","ATA","Madrooex","Yunhuipost","Oakh Harbour Freight Lines","Zoom","PIGGYSHIP","Go For GPS","DPD Portugal","Barsan Global Lojistik","Asendia Global","Kolay Gelsin","MNG Kargo","PTT Kargo","Scotty","PackUp","Surat Kargo","Sendeo Kargo","OTS","Leman","xmszm","YouParcel","Xindus","Moovin","Rivo","Allied Express","Grupo logistico Andreani","AO Logistics","Aramex","ATS Healthcare","Australia Post","Jitsu","BJS Distribution","Bluedart","Bollore Logistics","Bpost","BRT Bartolini","CBL Logistica","Chronopost France","Coordinadora","Correos Express","DACHSER","Delhivery","Destiny Transportation","Detrack","DHL Express","DHL Spain Domestic","DHL eCommerce Solutions","DHL eCommerce Asia","DHL Supply Chain Australia","Dialogo Logistica","Direct Couriers","DPD","DPD Hungary","DPD Russia","DPD UK","DX","Estafeta","Aramex Australia","Flash Express","GatiKWE","Go Express and logistics","GIO Express Inc","GLS Italy","GLS Netherlands","Helthjem","Hermes Germany","Hunter Express","iCumulus","International Seur","JNE","Kronos Express","Lalamove","Landmark Global","LaserShip","MalcaAmit","EVRi","Nationex","Ninja Van","Nippon Express","Nova Poshta","Innight Express Germany GmbH nox NachtExpress","Omniva","Orange Connex","OrangeDS Orange Distribution Solutions Inc","OSM Worldwide","Panther Reference","PFL","Posti","Royal Mail","Sagawa","Seino","SEKO Logistics","SF Express","ShipX","SMSA Express","Spanish Seur","StarTrack","Swiss Post","Yamato Singapore","TCS","TIPSA","Total Express","USPS","VIR Transport","Vietnam Post","Yodel Domestic","Yusen Logistics","CDL Last Mile","DPD Netherlands","GDPharm Logistics","GLS Spain","Packs","Payo","Quiqup","Sherpa","Czech Post","Metropolitan Warehouse and Delivery","Rhenus Logistics UK","Trunkrs","WeShip","Wineshipping","DHL Global Forwarding eCommerce","DPD Austria","Parcelstars","Tcat","GLS Hungary","Vesyl","Celeritas Transporte","Concise","DB Schenker Iceland","Deliverr","DHL Global Forwarding","First Logistics","GIG","LBC Express","Magyar Posta","Rixon Logistics","99minutos","Ader","Aras Cargo","Barq","BandH Worldwide","Bomi Group","CEVA Package","Chazki","Chile Express","DAO365","DHL Reference number","DHL supply chain India","Direct Freight Express","DKSH","DNJ Express","DSV Futurewave","DX B2B","Elite Express","FAN COURIER EXPRESS","Faxe Cargo","Fetchr","Glovo","Gebruder Weiss","Home Logistics","HSM Global","Ilyang logistics","Inexpost","Javit","Livrapide","Loggi","Logysto","Mail Boxes Etc","Marken","Groupe Mazet","MNX","Mondial Relay SpainPunto Pack","Mondial Relay France","Moova","Naqel Express","NTL logistics","Passport Shipping","Patheon Logistics","PolarSpeed Inc","Professional Parcel Logistics","Pro Carrier","Purolator International","Red je Pakketje","Relais Colis","SHIPA","Shippie","Shippify","Teliway SIC Express","Spectran","Speedy","Thijs Logistiek","Tipsa Reference","TNT France Reference","Tourline Express","Urgent Cargus","VOX SOLUCION EMPRESARIAL SRL","World Courier","WSP Express","Xpedigo","Zeek2Door","Activos24","AFL LOGISTICS","Agediss","Airmee","Argents Express Group","BioCair","Budbee","City Express","ClickLink","Corporate Couriers","CryoPDP","The Custom Companies","Designer Transport","DoorDash","DPD Switzerland","DPD Slovakia","East West Courier Pte Ltd","Eurodifarm","Estes Forwarding Worldwide","Europacket","Exelot Ltd","Expeditors API Reference","fairsenden","FitzMark","FragilePAK","GAC","Gojek","Grab","Hermes UK","Inntralog GmbH","Instabox","Integra2","InTime","Ivoy","Kerry Logistics","LCT do Brasil","Locus","TandW Delivery","Mensajeros Urbanos","Naeko Logistics","Novofarma","Sequoialog","Omni Returns","Paack","Pandago","ParcelPal","USPS Flats Pitney Bowes","Pgeon","Product Care Services Limited","Quickstat Courier LLC","Routific","SerVIP","SimpleTire","solistica","Spreetail","SortHub","Tonami","Uber","USPS Informed Visibility","Value Logistics","Ximex Delivery Express","D Express","Best Transport","OM LOGISTICS LTD","iMile","Kiitajat","Ransa","Tamer Logistics","AIT","Teleport","Snt Global Etrax","DHL GLOBAL FORWARDING PANAMA","DHL Global Forwarding Guatemala","Kerry Express TaiWan","mySendle","Chienventure","Papa","IB Venture","Secretlab","Mothership","Starlinks Global","Zuellig Pharma Korea","WOO YOUNG LOGISTICS CO","PHSE","Roche Internal Courier","DHL IE","ANC  Fleets Flyers PTY LTD","Veho","Arrow","C Chez Vous","Rendr","Kiwi Express Couriers","Zoom2U","Jumppoint","transoflex Express GmbH and Co KGaA","Fliway","Stop Start Transport Ltd","Fukuyama","SIGNIA LOGISTICS SAC","Borderless 360","Mobile Tyre Shop","DashLink","Bleckmann","M24 Logistics","XPO Last Mile France","Boxcheck","5Stringsolutions","Cargo Partner","On Way","Flash Express PH","Geodis MyParcel","Skelton","chronodiali","Alpha Freight","Ekol Lojistik","Courier Network Inc","Returnmates","TASCO BERHAD","Porter Express","Fastway Australia","UNITED CALIFORNIA FREIGHT SOLUTIONS","Toshi","BTX GLOBAL LOGISTICS","NTI Logistics","Sassy","P2P Delivery Ltd","Parcel Delivery Network","ecourier MDS","HTDK Shanghai","Parca Logistics","RXO","DSV UAE","Lalamove Plus","Road Runner Freight","MVL","SKY2C FREIGHT SYSTEMS INC","Yellow Diamond Logistics","SDS Logistics","POLARIS TRANSPORT CARRIERS INC","ABF","MAVINC","NACHOS TRANSPORTATION LLC","LUCAS TRUCKING LLC","EDI Express","Mountain Valley Express","A TRUCK EXPRESS","SAIA","Other"] },
        { apiName: "cf_carrier", label: "Carrier", type: "text" },
        { apiName: "cf_pro_number", label: "Pro Number", type: "text" },
        { apiName: "cf_bol", label: "BOL", type: "text" },
        { apiName: "cf_pick_up_ref_number", label: "Pickup Ref Number", type: "text" },
        { apiName: "cf_estimated_trucking_cost", label: "Estimated Trucking Cost", type: "currency" },
        { apiName: "cf_pickup_schedule_time", label: "Pickup Schedule Time", type: "datetime" },
        { apiName: "cf_pickup_time", label: "ETA for Pickup", type: "datetime" },
        { apiName: "cf_pickup_date", label: "Pickup Date", type: "datetime" },
        { apiName: "cf_eta_for_port_drop", label: "ETA for Port Drop", type: "datetime" },
        { apiName: "cf_port_drop_date", label: "Port Drop Date", type: "datetime" },
      ],
    },
  ],
};

const WAREHOUSE_TO_PORT_LAYOUT: ZohoLayout = {
  name: "Warehouse to Port",
  zohoLayoutId: "145882000113929880",
  sections: [
    {
      title: "Ticket Information",
      fields: [
        { apiName: "cf_ref_number", label: "Ref Number", type: "text" },
        { apiName: "cf_shipment_type_1", label: "Shipment Type", type: "picklist", options: ["Non Consolidation","Clubbed Shipment","Consolidation Service"] },
        { apiName: "cf_send_to_vhaul", label: "Send to Vhaul", type: "boolean" },
        { apiName: "cf_consol_id", label: "Consol ID", type: "text" },
      ],
    },
    {
      title: "Dispatch Instructions",
      fields: [
        { apiName: "cf_origin", label: "Origin Port", type: "text" },
        { apiName: "cf_destination", label: "Destination Port", type: "text" },
        { apiName: "cf_shipper_1", label: "Shipper", type: "picklist", options: ["Known","Unknown","Yet to Confirm"] },
        { apiName: "cf_quote_amount_1", label: "Quote Amount", type: "currency" },
        { apiName: "cf_quote_basis", label: "Quote Basis", type: "picklist", options: ["Flat","Per Kg"] },
        { apiName: "cf_quoted_by", label: "Quoted By", type: "text" },
        { apiName: "cf_pallets_x_dimensions", label: "Pallets x Dimensions", type: "textarea" },
        { apiName: "cf_gross_weight", label: "Gross Weight", type: "decimal" },
        { apiName: "cf_volumetric_weight", label: "Volumetric Weight", type: "decimal" },
        { apiName: "cf_chargeable_weight", label: "Chargeable Weight", type: "decimal" },
        { apiName: "cf_commodity_detail", label: "Commodity Detail", type: "text" },
        { apiName: "cf_stackable_and_turnable", label: "Stackable and Turnable", type: "multiselect", options: ["Stackable","Turnable","Non-Stackable"] },
        { apiName: "cf_service_type", label: "Service Type", type: "picklist", options: ["Door to Door","Door to Port","Port to Port","Port to Door"] },
        { apiName: "cf_trucking_by", label: "Shipment Terms", type: "picklist", options: ["EXW","FCA","CPT","CIP","DAP","DPU","DDP","FAS","FOB","CFR","CIF"] },
      ],
    },
    {
      title: "Pickup Instructions",
      fields: [
        { apiName: "cf_warehouse_pickup_instructions", label: "Warehouse Pickup Instructions", type: "textarea" },
      ],
    },
    {
      title: "Dispatch Operations",
      fields: [
        { apiName: "cf_dispatch_route", label: "Dispatch Route", type: "picklist", options: ["Via Warehouse","Direct to Port"] },
        { apiName: "cf_warehouse_location", label: "Warehouse Location", type: "text" },
        { apiName: "cf_port_drop_location", label: "Port Drop Location", type: "text" },
        { apiName: "cf_drop_cut_off_time", label: "Drop Cut Off Time", type: "datetime" },
        { apiName: "cf_carrier_picklist", label: "Carrier-Name", type: "picklist", options: ["Vhaul4u","Warehouse Trucker","Saia LTL Freight","Roadrunner Transport Service","Fedex","UPS","Estes","17 Post Service","2ebox","2GO","360 Lion Express","3JMS Logistics","472 Entregando","4PX","Best Express","A1Post","A2B Express Logistics","AAA Cooper","ABF Freight","ABX Express","aCommerce","ACS Courier","ACS Worldwide Express","Adicional Logistics","ADSOne","A Duie Pyle","Mexico AeroFlash","Aeronet","AEX Group","Agility","AIR21","Airpak Express","Airspeed International Corporation","ALLJOY SUPPLY CHAIN CO","alphaFAST","Always Express","Amazon Shipping Amazon MCF","Amazon","Swiship UK","Swiship DE","Swiship IN","Amazon order","Amazon Shipping","AMS Group","An Post","Anicam Global","Anjun","ANSERX","Anteraja","AO Deutschland Ltd","APC Postal Logistics","APC Overnight","APC Overnight Consignment Number","APG eCommerce Solutions Ltd","Aquiline","Arco Spedizioni SP","ARK Logistics","Arrow XL","ASE KARGO","Asendia","Asendia APAC","Asendia UK","Asendia USA","ASIGNA","ASMGLS Spain","Au Express","Austrian Post Express","Austrian Post Registered","Averitt Express","B2C Europe","BDMnet","Belpost","Bert Transport","Best Way Parcel","Better Trucks","Bulgarian Posts","JP BH Posta","BirdSystem","Blink","Bluecare Express Ltd","Blue Star","Blue Express","Bneed","Bombino Express Pvt Ltd","Bond","Bonds Couriers","Border Express","Boxberry","BoxC","Bpost international","Brazil Correios","Bring","Brouwer Transport en Logistiek BV","BRT BartoliniParcel ID","BRT BartoliniSender Reference","CAE Delivers","Cainiao","Cambodia Post","Canada Post","Canpar Courier","Capital Transport","Carriers","CarryFlap Co","CDEK","CDEK TR","Cello Square","Ceska Posta","CEVA LOGISTICS","CFL Logistics","CGS Express","Champion Logistics","China EMS ePacket","China Post","Chit Chats","Choir Express Indonesia","Chronopost PortugalDPD","CityLink Express","CJ GLS","CJ Logistics InternationalHong Kong","CJ Korea Express","CJ Century International","CJ Transnational Philippines","CJ Logistics International","CJ Packet","CL ELogistics Solutions Limited","Clevy Links","Cloudwish Asia","CN Logistics","ZYEX","CNE Express","cnwangtong","Colis Prive","Colissimo","CollectCo","Collect","MDS Collivery Pty Ltd","ComOne Express","CometTech","Conway Freight","Continental","Copa Airlines Courier","Cope Sensitive Freight","Correo Uruguayo","Correos de Mexico","Cosmetics Now","Courant Plus","Urbanfox","Courier Plus","Courier IT","CourierPost","Couriers Please","cPacket","Captain Express International","CRL Express","Croshot","CSE","CTC Express","Cubyn","Cuckoo Express","Cyprus Post","Daeshin","DAI Post","Daiichi Freight System Inc","Shanghai Aqrum Chemical Logistics CoLtd","PostNord Denmark","Danniao","Danske Fragtmaend","Dawn Wing","Day and Ross","Dayton Freight","DB Schenker B2B","DB Schenker","DB Schenker Sweden","DD Express Courier","DealerSend","DeliveriT","deliverE","DELIVERYONTIME LOGISTICS PVT LTD","Deliver Your Parcel","Delnext","Deltec Courier","Innovel","Deutsche Post Mail","DEXI","DHL Active Tracing","DHL Benelux","DHL Freight","Deutsche Post DHL","DHL Hong Kong","DHL Netherlands","DHL Express Piece ID","DHL Poland Domestic","DHL Supply Chain APAC","DHL Supply Chain Indonesia","DHL Parcel Spain","DHL Parcel NL","DHL Parcel Russia","DHL Parcel UK","Diamond Eurogistics Limited","GLS Logistic Systems Canada LtdDicom","DIDADI Logistics tech","Dimerco Express Group","Directlog","Direx","DMF","DobroPost","Doora Logistics","DPD Germany","DPD HK","DPD Ireland","DPD Poland","DPD Romania","DPE Express","DPE South Africa","DPEX","DSV","DTD Express","DTDC India","DTDC Australia","DTDC Express Global PTE LTD","DX Freight","Daylight Transport","Dynamic Logistics","Easy Mail","Chukou1","Ecargo","ECexpress","Echo","ECMS International Logistics Co","Ecom Express","ECOSCOOTING","eCoutier","EFS Ecommerce Fulfillment Service","Ekart","Yilian Elian Supply Chain","ELTA Hellenic Post","Emirates Post","EMPS Express","Endeavour Delivery","Envialia","Envialia Reference","eParcel Korea","ePost Global","Equick China","Top Ideal Express","Eshipping","Etomars","eTotal Solution Limited","RETS express","EU Fleet Solutions","Eurodis","EWE Global Express","DPD France formerly exapaq","Expeditors","Expresssale","FAR international","FarGood","Fastbox","Fastrak Services","Fasttrack","Fastway Ireland","Fastway New Zealand","Fastway South Africa","FDSEXPRESS","FedEx Cross Border","FedEx International MailService","FedEx Freight","FedEx UK","FERCAM Logistics and Transport","Fiege Logistics","Fiege Netherlands","First Flight Couriers","FirstMile","Flyt Express","FMX","Fast and Furious","Fonsen Logistics","forrun Pvt Ltd Arpatech Venture","Forward Air","Freightquote by CH Robinson","Frete Rapido","Fulfilla","Fulfillmen","Furdeco","GANGBAO Supplychain","GBA Services Ltd","GBSBroker","GDEX","Geis CZ","Gel Express Logistik","GEM Worldwide","GEODIS  Distribution and Express","GESWL Express","Giao hAng nhanh","Tai Wan Global Business","GlobalTranz","Globavend","Globegistics Inc","GLS","GLS Croatia","GLS Czech Republic","GLS General Logistics Systems Slovakia sro","GLS Slovenia","Dependable Supply Chain Services","Global Post","GoJavas","Go Rush","Greyhound","Grupo ampm","GSI EXPRESS","GSOGLSUSA","HanJin","HCT LOGISTICS COLTD","Haidaibao","Haidaibao BOX","Hellenic Greece Post","Hellmann Worldwide Logistics","Heppner Internationale Spedition GmbH and Co","Heppner France","Hermesworld","Hermes Einrichtungs Service GmbH and Co KG","HR Parcel","Hero Express","HFD","Hua Han Logistics","Hipshipper","HKD International Logistics","Holisol","Home Delivery Solutions Ltd","Hong Kong Post","Hound Express","Hrvatska Posta","HSDEXPRESS","HuanTong","Huodull","HX Express","idika","iparcel","Beone Logistics","IDEX","iDexpress Indonesia","IML","IMX Mail","India Post Domestic","India Post International","INDOPAKET","InPost Paczkomaty","InPost","IntelValley Supply chain ShenZhen Co Ltd","Intelipost TMS for LATAM","DPD Local","DPD Local reference","Interparcel Australia","Interparcel New Zealand","Interparcel UK","INTEX Paketdienst GmbH","Internet Express","Israel Post","Israel Post Domestic","Italy SDA","J Net","Jam Express","Janco Ecommerce","Janio Asia","Japan Post","Jayon Express JEX","JCEX","JD Worldwide","Jersey Post","JetShip Worldwide","JINSUNG TRADING","Jocom","Joom Logistics","Joying Box","JS EXPRESS","JandT CARGO","JandT EXPRESS MALAYSIA","JandT Express Vietnam","JX","K1 Express","Kangaroo Worldwide Express","KargomKolay CargoMini","Kyungdong Parcel","KEC","KedaEX","Kerry eCommerce","Kerry Express Thailand","Kerry TJ Logistics","Kerry Express Vietnam Co Ltd","KGM Hub","Kuehne Nagel","Keuhne Nagel Global","Komon Express","Korea Post EMS","Korea Post","KURASI","KWE Global","Shenzhen Jinghuada Logistics Co","Kua Yue Express","La Poste","Lao Post","Latvijas Pasts","Leader","Legion Express","LexShip","LHT Express","LICCARDI EXPRESS COURIER","liefery","Lietuvos Pastas","Line Clear Express and Logistics Sdn Bhd","Link BridgeBeiJinginternational logistics co","Lion Parcel","Logisters","Logwin Logistics","Lone Star Overnight","Loomis Express","Lotte Global Logistics","LTL","Logistic Worldwide Express","M Xpress Sdn Bhd","M3 Logistics","MailAmericas","MailPlus","MailPlus Japan","Mainfreight","Mainway","Malaysia Post EMS  Pos Laju","Malaysia Post  Registered","Matdespatch","Matkahuolto","MBW Courier Inc","Meest","Mexico Redpack","Mexico Senda Express","PT MGLOBAL LOGISTICS INDONESIA","Mhi","Mikropakket","Mikropakket Belgium","Milkman","MISUMI Group Inc","Mobi Logistica","Mondial Relay","Morelink","Morning Express","MRW","MUDITA","MandX cargo","My DynaLogic","NACEX","NACEX Spain","Nanjing Woyuan","National Sameday","Nationwide Express","NZ Post","Newegg Express","Newgistics","Newgistics API","New Zealand Couriers","Nhans Solutions","Nightline","Nim Express","NimbusPost","Ninja Van Indonesia","Ninja Van Malaysia","Ninja Van Thailand","NiPost","NandM Transfer Co","Norsk Global","Nova Poshta International","NOX NightTimeExpress","Nhat Tin Logistics","NYT SUPPLY CHAIN LOGISTICS Co","OCA Argentina","OCS ANA Group","OCS WORLDWIDE","OkayParcel","Old Dominion Freight Line","Omni Parcel","One click delivery services","One World Express","OnTrac","FedEx Poland Domestic","Overseas Express","PACKFLEET","Packlink","PAL Express Limited","The Pallet Network","Palletways","PanAsia International","Pandu Logistics","Panther","Paper Express","Paquetexpress","Parcel Force","Parcel2Go","Parcelink Logistics","Parcelledin","PARCEL ONE","ParcelPoint Pty Ltd","Parcel Post Singapore","Parcel Right","Parcel To Post","CIRRO ECommerce","Park N Parcel","PFC Express","Pickrr","Pickupp","PICK UPP","PICK UPP Singapore","Pidge","PIL Logistics China Co","Pilot Freight Services","Pitney Bowes","PITT OHIO","Planzer Group","Poczta Polska","Pony express","Portugal CTT","Portugal Seur","Pos Indonesia Domestic","Post Serbia","Post of Slovenia","Post56","Posta Romana","Posta Plus","Poste Italiane","Poste Italiane Paccocelere","Posten Norge  Bring","PostNL Domestic","PostNL International 3S","PostNL International","PostNord Logistics","Post ONE","PostPlus","Iceland Post","PayPal Package","Pressio","Professional Couriers","ProMed Delivery","PTS","PTT Posta","Purolator","Quantium","Qwintry Logistics","Qxpress","Raben Group","RAF Philippines","RaidereX","RAM","Red Carpet Logistics","Redur Spain","Rhenus Logistics","Rincos","RL Carriers","Roadbull Logistics","Rocket Parcel International","RoyalShipments","RPD2man Deliveries","RPX Logistics","RPX Online","Russian Post","Ruston","RZY Express","Safexpress","SAILPOST SPA","SAP EXPRESS","South African Post Office","Saudi Post","Sber Logistics","Scudex Express","Southeastern Freight Lines","Sending Transporte Urgente y Comunicacion","Sendit","Sendle","Setel Express","SF Express China","SF International","SFC","SFCSendfromChina","Shadowfax","Ship It Asia","ShipEntegra","ShipGate","Shippit","Shiprocket X","SHIPTER","Westgate Global","ShopfansRU LLC","Olive","SENHONG INTERNATIONAL LOGISTICS","Shree Maruti Courier Services Pvt Ltd","Shree Anjani Courier","SHREE NANDAN COURIER","SHREE TIRUPATI COURIER SERVICES PVT LTD","Shypmax","JandT Express Singapore","Singapore Post","Singapore Speedpost","Sin Global Express","Sinotrans","Siodemka","Slovenska posta","SkyPostal","SKYBOX","SkyNet Malaysia","Skynet World Wide Express South Africa","SkyNet Worldwide Express","SkyNet Worldwide Express UAE","Skynet Worldwide Express UK","SMARTCAT","Smooth Couriers","Sonic Transportation and Logistics","Correos de Espana","Specialised Freight","Speed Couriers","SpeeDee Delivery","SPEEDEX","SPOTON Logistics Pvt Ltd","Spring GDS","SPRINT PACK","Shopee Express","Shopee Xpress","SRE Korea","SRT Transport","Stallion Express","Star Track Courier","Star Track Express","STARKEN","Stat Overnight","STEP FORWARD FREIGHT SERVICE CO LTD","STO Express","STONE3PL","Streck Transport","Sutton Transport","PostNord Sweden","Swiship","Sunyou Post","DPEX China","SZENDEX","Taiwan Post","TAQBIN Hong Kong","Yamato Japan","PRESIDENT TRANSNET CORP","TONDA GLOBAL","Geniki Taxydromiki","Tazmanian Freight Systems","TCK Express","Testing Courier","TFM Xpress","TForce Final Mile","Kerry Express Hong Kong","Thabit Logistics","Thailand Thai Post","TP Logistic","The Courier Guy","TDG The Delivery Group","TIG Freight","Tiki","TNT","TNT Australia","TNTClick Italy","TNT France","TNT Italy","TNT Reference","TNT UK","TNT UK Reference","Toll IPEC","Toll New Zealand","Team Global Express","Tolos","Tophatter Express","TopYou","CTT Express","Trackon Couriers Pvt Ltd","P2P TrakPak","Trans Kargo Internasional","Trans2u","TransMission","TRUMPCARD LLC","Tuffnells Parcels Express","Tuffnells Parcels Express Reference","UBI Smart Parcel","ucexpress","UCS","United Delivery Service","UK Mail","UkrPoshta","UPS Freight","UPS Mail Innovations","UPS Reference","USF Reddaway","uShip","Venipak","ViaEurope","ViettelPost","VIWO IoT","VicTas Freight Express","Wahana","WanbExpress","Weaship","WeDo Logistics","WePost Sdn Bhd","We World Express","Whistl","Wise Express","Wiseloads","WishPost","Wizmo","wnDirect","Worldnet Logistics","XDP Express","XDP Express Reference","XL Express","Xpert Delivery","XPO","Xpostph","XpressBees","Xpressen","XQ Express","Xingyunyi Logistics","Yakit","Yanwen","Shenzhen 1st International LogisticsGroupCo","YDH express","YiFan Express","Yodel International","Yodel Direct","YRC","YTO Express","Yunda Express","YunExpress","Yurtici Kargo","HUAHANG EXPRESS","YYEXPRESS","Zajil Express Company","Zeleris","Eshun international Logistic","Ziing","Zinc","ZJS International","ZTO Express China","ZTO Express Global","DMSMatrix","Go People","HUBBED","Panther Order Number","Sims Global","Transport Ambientales","Georgian Post","GO Logistics and Storage","Luwjistik","UENVIOS","BUFFALO","ACI Logistix","Morning Global","FRONTdoor Collective","TransVirtual","Quiet Platforms","Burd Delivery Aps","Pandion","TYP","ICS COURIER","ShunBang Express","ViaXpress","XGS","uParcel","Tomydoor","Plycon Transportation Group","FlipXpress","Northline","Crossflight Limited","Ozeparts Shipping","QTrack","Fast Despatch Logistics Limited","Fastship Express","Optima Courier","FUJIE EXPRESS","iThink Logistics","Cago","Eco Freight","Tusk Logistics","EMS","DeliverDirect","Servientrega","Trusk France","INTERSMARTTRANS and SOLUTIONS SL","JandT Express Philippines","Movianto","Thunder Express Australia","Flight Logistics Group","SHIPXPRESS","ADS Express","Big Smart","Med Africa Logistics","Packeta","Pakajo World","Sppedaf Express","Cacesa","Asyad Express","EasyRoutes","EXPRESSONE","GC Express","TDN","Early Bird","Swiship JP","Bringer Parcel Services","SpeedX","SkyExpress Internationals","Swiss Universal Express","Associate Global Systems","American West","Ninjavan Vietnam","Castle Parcels","Spediscionline","DIR","AICS","Super Pac Line","DOMINO","GLS USA","Paikeda","LogoiX","upschecker","RPM","Urbit","Go Bolt","hepsiJET","Grand Slam Express","LIEFERGRUN","SG LINK","Packaly","packman","eShipper","Multientrega","Welivery","GLS Romania","Urbify","eTower","GTA GSM","Yunant","Sky King","Maergo","Transpak Inc","Aoyue","shopline","Easyparcel","Team Express Service LLC","Kinisi Transport Pty Ltd","Navlungo","LM Parcel","Sendy Express","Discount Post","Jawar","FleetOptics","ShipGlobal","Southwestern Motor Transport Inc","ATA","Madrooex","Yunhuipost","Oakh Harbour Freight Lines","Zoom","PIGGYSHIP","Go For GPS","DPD Portugal","Barsan Global Lojistik","Asendia Global","Kolay Gelsin","MNG Kargo","PTT Kargo","Scotty","PackUp","Surat Kargo","Sendeo Kargo","OTS","Leman","xmszm","YouParcel","Xindus","Moovin","Rivo","Allied Express","Grupo logistico Andreani","AO Logistics","Aramex","ATS Healthcare","Australia Post","Jitsu","BJS Distribution","Bluedart","Bollore Logistics","Bpost","BRT Bartolini","CBL Logistica","Chronopost France","Coordinadora","Correos Express","DACHSER","Delhivery","Destiny Transportation","Detrack","DHL Express","DHL Spain Domestic","DHL eCommerce Solutions","DHL eCommerce Asia","DHL Supply Chain Australia","Dialogo Logistica","Direct Couriers","DPD","DPD Hungary","DPD Russia","DPD UK","DX","Estafeta","Aramex Australia","Flash Express","GatiKWE","Go Express and logistics","GIO Express Inc","GLS Italy","GLS Netherlands","Helthjem","Hermes Germany","Hunter Express","iCumulus","International Seur","JNE","Kronos Express","Lalamove","Landmark Global","LaserShip","MalcaAmit","EVRi","Nationex","Ninja Van","Nippon Express","Nova Poshta","Innight Express Germany GmbH nox NachtExpress","Omniva","Orange Connex","OrangeDS Orange Distribution Solutions Inc","OSM Worldwide","Panther Reference","PFL","Posti","Royal Mail","Sagawa","Seino","SEKO Logistics","SF Express","ShipX","SMSA Express","Spanish Seur","StarTrack","Swiss Post","Yamato Singapore","TCS","TIPSA","Total Express","USPS","VIR Transport","Vietnam Post","Yodel Domestic","Yusen Logistics","CDL Last Mile","DPD Netherlands","GDPharm Logistics","GLS Spain","Packs","Payo","Quiqup","Sherpa","Czech Post","Metropolitan Warehouse and Delivery","Rhenus Logistics UK","Trunkrs","WeShip","Wineshipping","DHL Global Forwarding eCommerce","DPD Austria","Parcelstars","Tcat","GLS Hungary","Vesyl","Celeritas Transporte","Concise","DB Schenker Iceland","Deliverr","DHL Global Forwarding","First Logistics","GIG","LBC Express","Magyar Posta","Rixon Logistics","99minutos","Ader","Aras Cargo","Barq","BandH Worldwide","Bomi Group","CEVA Package","Chazki","Chile Express","DAO365","DHL Reference number","DHL supply chain India","Direct Freight Express","DKSH","DNJ Express","DSV Futurewave","DX B2B","Elite Express","FAN COURIER EXPRESS","Faxe Cargo","Fetchr","Glovo","Gebruder Weiss","Home Logistics","HSM Global","Ilyang logistics","Inexpost","Javit","Livrapide","Loggi","Logysto","Mail Boxes Etc","Marken","Groupe Mazet","MNX","Mondial Relay SpainPunto Pack","Mondial Relay France","Moova","Naqel Express","NTL logistics","Passport Shipping","Patheon Logistics","PolarSpeed Inc","Professional Parcel Logistics","Pro Carrier","Purolator International","Red je Pakketje","Relais Colis","SHIPA","Shippie","Shippify","Teliway SIC Express","Spectran","Speedy","Thijs Logistiek","Tipsa Reference","TNT France Reference","Tourline Express","Urgent Cargus","VOX SOLUCION EMPRESARIAL SRL","World Courier","WSP Express","Xpedigo","Zeek2Door","Activos24","AFL LOGISTICS","Agediss","Airmee","Argents Express Group","BioCair","Budbee","City Express","ClickLink","Corporate Couriers","CryoPDP","The Custom Companies","Designer Transport","DoorDash","DPD Switzerland","DPD Slovakia","East West Courier Pte Ltd","Eurodifarm","Estes Forwarding Worldwide","Europacket","Exelot Ltd","Expeditors API Reference","fairsenden","FitzMark","FragilePAK","GAC","Gojek","Grab","Hermes UK","Inntralog GmbH","Instabox","Integra2","InTime","Ivoy","Kerry Logistics","LCT do Brasil","Locus","TandW Delivery","Mensajeros Urbanos","Naeko Logistics","Novofarma","Sequoialog","Omni Returns","Paack","Pandago","ParcelPal","USPS Flats Pitney Bowes","Pgeon","Product Care Services Limited","Quickstat Courier LLC","Routific","SerVIP","SimpleTire","solistica","Spreetail","SortHub","Tonami","Uber","USPS Informed Visibility","Value Logistics","Ximex Delivery Express","D Express","Best Transport","OM LOGISTICS LTD","iMile","Kiitajat","Ransa","Tamer Logistics","AIT","Teleport","Snt Global Etrax","DHL GLOBAL FORWARDING PANAMA","DHL Global Forwarding Guatemala","Kerry Express TaiWan","mySendle","Chienventure","Papa","IB Venture","Secretlab","Mothership","Starlinks Global","Zuellig Pharma Korea","WOO YOUNG LOGISTICS CO","PHSE","Roche Internal Courier","DHL IE","ANC  Fleets Flyers PTY LTD","Veho","Arrow","C Chez Vous","Rendr","Kiwi Express Couriers","Zoom2U","Jumppoint","transoflex Express GmbH and Co KGaA","Fliway","Stop Start Transport Ltd","Fukuyama","SIGNIA LOGISTICS SAC","Borderless 360","Mobile Tyre Shop","DashLink","Bleckmann","M24 Logistics","XPO Last Mile France","Boxcheck","5Stringsolutions","Cargo Partner","On Way","Flash Express PH","Geodis MyParcel","Skelton","chronodiali","Alpha Freight","Ekol Lojistik","Courier Network Inc","Returnmates","TASCO BERHAD","Porter Express","Fastway Australia","UNITED CALIFORNIA FREIGHT SOLUTIONS","Toshi","BTX GLOBAL LOGISTICS","NTI Logistics","Sassy","P2P Delivery Ltd","Parcel Delivery Network","ecourier MDS","HTDK Shanghai","Parca Logistics","RXO","DSV UAE","Lalamove Plus","Road Runner Freight","MVL","SKY2C FREIGHT SYSTEMS INC","Yellow Diamond Logistics","SDS Logistics","POLARIS TRANSPORT CARRIERS INC","ABF","MAVINC","NACHOS TRANSPORTATION LLC","LUCAS TRUCKING LLC","EDI Express","Mountain Valley Express","A TRUCK EXPRESS","SAIA","Other"] },
        { apiName: "cf_carrier", label: "Carrier", type: "text" },
        { apiName: "cf_pro_number", label: "Pro Number", type: "text" },
        { apiName: "cf_bol", label: "BOL", type: "text" },
        { apiName: "cf_pick_up_ref_number", label: "Pickup Ref Number", type: "text" },
        { apiName: "cf_estimated_trucking_cost", label: "Estimated Trucking Cost", type: "currency" },
        { apiName: "cf_eta_for_warehouse_pickup", label: "ETA for Warehouse Pickup", type: "datetime" },
        { apiName: "cf_warehouse_pickup_date", label: "Warehouse Pickup Date", type: "datetime" },
        { apiName: "cf_eta_for_port_drop", label: "ETA for Port Drop", type: "datetime" },
        { apiName: "cf_port_drop_date", label: "Port Drop Date", type: "datetime" },
      ],
    },
  ],
};

const US_AIR_BOOKING_LAYOUT: ZohoLayout = {
  name: "US Air Booking",
  zohoLayoutId: "145882000106927881",
  sections: [
    {
      title: "Ticket Information",
      fields: [
        { apiName: "cf_ref_number", label: "Ref Number", type: "text" },
        { apiName: "cf_shipment_type_1", label: "Shipment Type", type: "picklist", options: ["Non Consolidation","Clubbed Shipment","Consolidation Service"] },
        { apiName: "cf_consol_id", label: "Consol ID", type: "text" },
        { apiName: "cf_rebook_count", label: "Rebook Count", type: "decimal" },
        { apiName: "cf_rebook_reasons", label: "Rebook Reasons", type: "multiselect", options: ["Cargo Not Ready at Origin","Cargo Readiness Delayed","Incorrect Cargo Ready Date","Partial Cargo Ready","Pickup Delayed","Pickup Missed / Failed","Trucker No-Show","Trucker Capacity / Equipment Issue","Pickup Appointment Issue","Traffic / Road Delay","Vehicle Breakdown","Cargo Arrived Late at Warehouse","Incorrect Warehouse Arrival Estimate","Insufficient Warehouse Buffer Time","Cargo Not On-Hand as Expected","Warehouse Processing Delay","Palletization / Repacking Delay","Screening / Security Delay","Labeling / Marking Issue","Warehouse Manpower Issue","Cargo Damage / Inspection Required","Airline Cut-Off Missed","Late Dispatch from Warehouse","Drop-Off Appointment Issue","Airport / Terminal Congestion","Customer Requested Schedule Change","Shipper Requested Schedule Change","Customer Approval Pending / Delayed","Customer Instructions Changed","Customer Documentation Delay","Air Ops Planning Error","Incorrect Information Provided to Booking Team","Late Rebooking Request from Air Ops","Internal Communication Gap","Dubai Team Coordination Issue","Sales / Account Executive Coordination Issue","Cargo Dimensions Changed","Cargo Weight Changed","Piece Count Changed","Commodity Changed","DG Status Changed / Identified","Stackability Changed","Shipment Volume Increased","Documentation Incomplete","Documentation Error / Correction","Customs Clearance Delay","DG Documentation Issue","Compliance / Security Hold","Airline Flight Cancelled","Airline Schedule Changed","Airline Booking Cancelled","Airline Space Not Available","Airline Offload / Rollover","Airline Capacity Reduction","Airline Operational Issue","Rate Changed","Better Rate / Routing Selected","Routing Changed","Airline Changed","Service Level Changed","Weather Disruption","Airport Closure / Restriction","Strike / Labor Disruption","Government / Regulatory Restriction","Force Majeure / Unforeseen Event","Other – Specify"] },
      ],
    },
    {
      title: "Booking Instructions",
      fields: [
        { apiName: "cf_origin", label: "Origin Port", type: "text" },
        { apiName: "cf_destination", label: "Destination Port", type: "text" },
        { apiName: "cf_shipper_1", label: "Shipper", type: "picklist", options: ["Known","Unknown","Yet to Confirm"] },
        { apiName: "cf_drop_date", label: "Drop Date", type: "datetime" },
        { apiName: "cf_pallets_x_dimensions", label: "Pallets x Dimensions", type: "textarea" },
        { apiName: "cf_gross_weight", label: "Gross Weight", type: "decimal" },
        { apiName: "cf_volumetric_weight", label: "Volumetric Weight", type: "decimal" },
        { apiName: "cf_chargeable_weight", label: "Chargeable Weight", type: "decimal" },
        { apiName: "cf_commodity_detail", label: "Commodity Detail", type: "text" },
        { apiName: "cf_stackable_and_turnable", label: "Stackable and Turnable", type: "multiselect", options: ["Stackable","Turnable","Non-Stackable"] },
        { apiName: "cf_booking_instructions", label: "Booking Instructions", type: "textarea" },
        { apiName: "cf_pre_decided_carrier", label: "Pre-decided Carrier", type: "picklist", options: ["Yes","No"] },
        { apiName: "cf_service_type", label: "Service Type", type: "picklist", options: ["Door to Door","Door to Port","Port to Port","Port to Door"] },
        { apiName: "cf_trucking_by", label: "Shipment Terms", type: "picklist", options: ["EXW","FCA","CPT","CIP","DAP","DPU","DDP","FAS","FOB","CFR","CIF"] },
        { apiName: "cf_quote_amount_1", label: "Quote Amount", type: "currency" },
        { apiName: "cf_quote_basis", label: "Quote Basis", type: "picklist", options: ["Yet to Confirm","Flat","Per Kg"] },
        { apiName: "cf_quoted_by", label: "Quoted By", type: "text" },
      ],
    },
    {
      title: "Booking Operations",
      fields: [
        { apiName: "cf_awb", label: "AWB", type: "text" },
        { apiName: "cf_carrier_picklist", label: "Carrier-Name", type: "picklist", options: ["NA","Korean Air Lines","Silk Way West Airlines","Nippon Cargo Airlines NCA","Carousel Logistics","Etihad Airways","JetBlue","Egyptair","Qatar Airways","Japan Airlines","Air Canada","Virgin Atlantic Airways","Delta Air Lines","United Airlines","Turkmenistan Airlines","Finnair","Ethiopian Airlines","Fedex","Euroasian GSA","Air France","Norse Atlantic Airways","CargoJet Airlines","Shenzhen Andashun ADS Masterloader","China Eastern","ITA Airways Cargo","American Airlines Cargo","Fits Cargo","Caribbean Airlines Cargo","MNG","EL AL Israel Airlines","Avianca Cargo","Air India","LATAM Airlines","Scandinavian Airlines SAS","Emirates","British Airways","Lufthansa","IAG Group British Airways Iberia","KUB Air Cargo CSA","KLM","Sun Class","Widerøe","Turkish Airlines","Condor","China Southern","ANA Cargo All Nippon Airways","Chapman Freeborn","Thai Cargo","TUI","TAP Air Cargo","OS","Vueling Cargo","Aer Lingus","Gulf Air","Oman Air","Swiss","Philippine Airlines","UPS Airlines","Royal Air Maroc","Polar Air Cargo","Cargolux","Air Class Lineas Aereas","Copa Airlines","Atlas Air","China Cargo Airlines Ltd","Asiana","Fiji Airways","MSC AIR CARGO","LOT Polish Airlines","Rwandair","Singapore Airlines","Southwest Airlines","Alaska Airlines","Air New Zealand","Air Tahiti Nui","Mercury Americas","Icelandair","SriLankan","Cathay Cargo","Air Europa","Kalitta","Hawaiian","Air Menzies International","Qantas Airways","Kuwait Airways","EAT DHL Aviation","Saudi Arabian Airlines","China Airlines","EVA Air","Amerijet International","Vietnam Airlines","Hong Kong Airlines","Neos","Malaysia Airlines","Kenya Airways","Pakistan International Airlines","Royal Jordanian","Tampa Cargo","South African Airways","Aeromexico","Cayman Airways","Star Air","WestJet","Sun Country Airlines","Hainan Airlines","Wright Air Service","VivaAerobus","Air Europe","Equaflight Service","Aerolineas Argentinas","Avianca El Salvador","Omskavia Airlines","Bringer Air Cargo","Air Malta","Warbelows Air Ventures","TAAG Angola Airlines","MIAT Mongolian Airlines","Air Serbia","Hong Kong Air Cargo","Air Mauritius","FrenchBee","Xiamen Airlines","CAL Cargo Air Lines","IAG Cargo","Air Menzies","Shipco Transport","Solent Freight Services","Air China Limited","American Worldwide Agencies","Sichuan Airlines","DNA Logistics","Aerounion","Heavyweight Air Express","Air Senegal SA","HiSky","Volaris","Azul Cargo","Air Premia","Shared Freight Service","UAC","MasAir","Trans Caribbean Cargo","My Freighter","IBC Airways","Astral Aviation","Starlux Cargo","Magma Aviation","Arkia Israeli Airlines","Garuda Indonesia Cargo","CMA CGM","Coyne Airways","Azerbaijan Hava Yollary","AirZeta","Skyworld Air Cargo","Air Transat","Skynet","AirAsia X","CEBU Pacific Air","MSC","Other"] },
        { apiName: "cf_carrier", label: "Carrier", type: "text" },
        { apiName: "cf_booking_rate", label: "Booking Rate", type: "currency" },
        { apiName: "cf_currency_type", label: "Currency Type", type: "picklist", options: ["USD","CAD"] },
        { apiName: "cf_port_drop_location", label: "Port Drop Location", type: "text" },
        { apiName: "cf_drop_cut_off_time", label: "Drop Cut Off Time", type: "datetime" },
      ],
    },
  ],
};

export const LAYOUT_GROUPS: readonly LayoutGroup[] = [
  { department: "Air Ops", zohoDepartmentId: "145882000002727511", role: "parent", layouts: [VIA_WAREHOUSE_LAYOUT, DIRECT_TO_PORT_LAYOUT] },
  { department: "US Dispatch Team", zohoDepartmentId: "145882000106928698", role: "child", layouts: [DISPATCH_TO_WAREHOUSE_LAYOUT, DISPATCH_TO_PORT_LAYOUT, WAREHOUSE_TO_PORT_LAYOUT] },
  { department: "US Air Booking", zohoDepartmentId: "145882000106908336", role: "child", layouts: [US_AIR_BOOKING_LAYOUT] },
];

const ALL_LAYOUTS: readonly ZohoLayout[] = LAYOUT_GROUPS.flatMap((g) => g.layouts);
const LAYOUT_BY_NAME = new Map<string, ZohoLayout>(ALL_LAYOUTS.map((l) => [l.name, l]));

export function getLayout(name: string | null | undefined): ZohoLayout | undefined {
  return name ? LAYOUT_BY_NAME.get(name) : undefined;
}

/**
 * Layouts a shipment can switch between: Air Ops layouts for a top-level shipment; for a
 * child, its own department's layouts (by Zoho department id), or every child layout when
 * the department isn't known.
 */
export function layoutsForShipment(isChild: boolean, zohoDepartmentId: string | null | undefined): readonly ZohoLayout[] {
  if (!isChild) return LAYOUT_GROUPS.filter((g) => g.role === "parent").flatMap((g) => g.layouts);
  const own = LAYOUT_GROUPS.find((g) => g.role === "child" && g.zohoDepartmentId === zohoDepartmentId);
  return own ? own.layouts : LAYOUT_GROUPS.filter((g) => g.role === "child").flatMap((g) => g.layouts);
}

/** Every field across all layouts, one entry per Zoho API name (first definition wins). */
export const ALL_LAYOUT_FIELDS: readonly LayoutField[] = (() => {
  const seen = new Map<string, LayoutField>();
  for (const l of ALL_LAYOUTS) for (const s of l.sections) for (const f of s.fields) if (!seen.has(f.apiName)) seen.set(f.apiName, f);
  return [...seen.values()];
})();

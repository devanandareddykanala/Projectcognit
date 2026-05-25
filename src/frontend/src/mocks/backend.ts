import type { backendInterface } from "../backend";
import type {
  Farm,
  Field,
  CropSeason,
  FarmMember,
  FarmerProfile,
  NotificationEntity,
  CropMSP,
  ClassificationEntry,
  ClassificationCode,
  InviteToken,
  AuditLog,
  LandRecord,
  CropHarvest,
} from "../backend";
import {
  CropStage,
  MemberRole,
  QualityGrade,
  UserRole,
} from "../backend";

const NOW = BigInt(Date.now()) * BigInt(1_000_000);

const demoFarm: Farm = {
  id: BigInt(1),
  ownershipType: "Self-owned",
  ownerPrincipal: "2vxsx-fae" as any,
  ksId: "KS-AP-2026-483921",
  name: "Develvyn Farm",
  createdAt: NOW,
  surveyNumber: "123/A",
  isDemo: true,
  purposes: ["Crops", "Horticulture"],
  totalAreaSqm: BigInt(6070), // ~1.5 acres
  district: "Kadapa",
  state: "Andhra Pradesh",
  village: "Galiveedu",
  mandal: "Galiveedu",
};

const demoField: Field = {
  id: BigInt(1),
  soilType: "Red Sandy Loam",
  irrigationType: "Drip",
  name: "North Block",
  createdAt: NOW,
  unit: "acres",
  isActive: true,
  geoPoints: [[14.5, 79.5], [14.501, 79.501]],
  areaSqm: BigInt(4047),
  tenure: "Owned",
  farmId: BigInt(1),
};

const demoCropSeason: CropSeason = {
  id: BigInt(1),
  isInterCrop: false,
  financialYear: "2025-26",
  mspPerQuintal: BigInt(2275),
  expectedHarvestDate: NOW + BigInt(30) * BigInt(24) * BigInt(3600) * BigInt(1_000_000_000),
  createdAt: NOW,
  season: "Kharif",
  stage: CropStage.Vegetative,
  cropName: "Paddy",
  areaSqm: BigInt(4047),
  variety: "BPT-5204",
  farmId: BigInt(1),
  sowingDate: NOW - BigInt(60) * BigInt(24) * BigInt(3600) * BigInt(1_000_000_000),
  fieldId: BigInt(1),
};

const demoMember: FarmMember = {
  id: BigInt(1),
  principal: "2vxsx-fae" as any,
  relation: "Owner",
  name: "Balaji Singh",
  joinedAt: NOW,
  role: MemberRole.Admin,
  emoji: "👨‍🌾",
  addedBy: "2vxsx-fae" as any,
  moduleToggles: {
    finance: true,
    fisheries: false,
    poultry: false,
    labour: true,
    crops: true,
    greenhouse: false,
    solar: false,
    horticulture: true,
    dairy: false,
    machinery: true,
  },
  farmId: BigInt(1),
};

const demoProfile: FarmerProfile = {
  principal: "2vxsx-fae" as any,
  name: "Balaji Singh",
  fpoMember: false,
  aadhaarBankLinked: true,
  mobile: "9876543210",
};

const demoNotification: NotificationEntity = {
  id: BigInt(1),
  title: "SHC Renewal Due",
  notifType: "reminder",
  body: "Soil Health Card for North Block expires in 80 days",
  createdAt: NOW,
  soundType: "alert",
  isRead: false,
  isDismissed: false,
  recipientPrincipal: "2vxsx-fae" as any,
  farmId: BigInt(1),
};

const demoMSP: CropMSP = {
  id: BigInt(1),
  financialYear: "2025-26",
  mspPerQuintal: BigInt(2275),
  lastUpdated: NOW,
  season: "Kharif",
  cropName: "Paddy",
};

const demoClassification: ClassificationEntry = {
  code: "AI-CRP-001",
  description: "Agricultural income from crop sales",
  warnings: [],
  examples: ["Paddy sale", "Wheat sale"],
};

const demoClassificationCode: ClassificationCode = {
  taxSection: "Section 10(1)",
  code: "AI-CRP-001",
  incomeType: "Agricultural Income",
  guidance: "Exempt from income tax under Section 10(1) of the Income Tax Act.",
};

const demoInvite: InviteToken = {
  id: BigInt(1),
  token: "KS-INV-ABC123",
  expiresAt: NOW + BigInt(7) * BigInt(24) * BigInt(3600) * BigInt(1_000_000_000),
  code: "ABC123",
  hmac: "dummy-hmac",
  createdBy: "2vxsx-fae" as any,
  role: MemberRole.Member,
  moduleToggles: {
    finance: false,
    fisheries: false,
    poultry: false,
    labour: true,
    crops: true,
    greenhouse: false,
    solar: false,
    horticulture: false,
    dairy: false,
    machinery: false,
  },
  farmId: BigInt(1),
};

const demoAuditLog: AuditLog = {
  id: BigInt(1),
  action: "FARM_CREATED",
  entityId: "1",
  timestamp: NOW,
  details: "Farm created: Develvyn Farm",
  actorPrincipal: "2vxsx-fae" as any,
  entityType: "Farm",
  farmId: BigInt(1),
};

const demoLandRecord: LandRecord = {
  id: BigInt(1),
  adangalNumber: "ADG-2025-001",
  state: "Andhra Pradesh",
  fieldId: BigInt(1),
};

const demoHarvest: CropHarvest = {
  id: BigInt(1),
  actualYieldQt: 24.5,
  recordedBy: "2vxsx-fae" as any,
  qualityGrade: QualityGrade.FAQ,
  cropSeasonId: BigInt(1),
  harvestDate: NOW,
};

export const mockBackend: backendInterface = {
  acceptInvite: async (_code) => ({ __kind__: "ok", ok: demoFarm }),
  addFarmMember: async (_farmId, _name, _relation, _emoji, _phone, _role, _toggles) => ({ __kind__: "ok", ok: demoMember }),
  assignCallerUserRole: async (_user, _role) => undefined,
  classifyIncome: async (_module, _itemType, _channel) => ({ __kind__: "ok", ok: demoClassificationCode }),
  createCropSeason: async (..._args) => ({ __kind__: "ok", ok: demoCropSeason }),
  createFarm: async (..._args) => ({ __kind__: "ok", ok: demoFarm }),
  createField: async (..._args) => ({ __kind__: "ok", ok: demoField }),
  deleteField: async (_fieldId) => ({ __kind__: "ok", ok: true }),
  generateInvite: async (_farmId, _role, _toggles) => ({ __kind__: "ok", ok: demoInvite }),
  getActiveInvites: async (_farmId) => ({ __kind__: "ok", ok: [demoInvite] }),
  getAllMSPRates: async (_fy) => [demoMSP],
  getAuditLog: async (_farmId, _limit) => ({ __kind__: "ok", ok: [demoAuditLog] }),
  getCallerUserRole: async () => UserRole.user,
  getClassificationCodes: async () => [demoClassification],
  getCropMSP: async (_cropName, _season, _fy) => ({ __kind__: "ok", ok: demoMSP }),
  getCropSeasonsForFarm: async (_farmId, _fy) => ({ __kind__: "ok", ok: [demoCropSeason] }),
  getCropSeasonsForField: async (_fieldId) => ({ __kind__: "ok", ok: [demoCropSeason] }),
  getDemoFarm: async () => ({ __kind__: "ok", ok: demoFarm }),
  getFarm: async (_farmId) => ({ __kind__: "ok", ok: demoFarm }),
  getFarmMembers: async (_farmId) => ({ __kind__: "ok", ok: [demoMember] }),
  getFarmerProfile: async () => ({ __kind__: "ok", ok: demoProfile }),
  getFieldsForFarm: async (_farmId) => ({ __kind__: "ok", ok: [demoField] }),
  getLandRecord: async (_fieldId) => ({ __kind__: "ok", ok: demoLandRecord }),
  getNotifications: async (_farmId) => ({ __kind__: "ok", ok: [demoNotification] }),
  getUserFarms: async () => [demoFarm],
  isCallerAdmin: async () => true,
  logHarvest: async (..._args) => ({ __kind__: "ok", ok: demoHarvest }),
  markNotificationRead: async (_notifId) => ({ __kind__: "ok", ok: true }),
  removeFarmMember: async (_farmId, _memberId) => ({ __kind__: "ok", ok: true }),
  revokeInvite: async (_farmId, _inviteId) => ({ __kind__: "ok", ok: true }),
  saveFarmerProfile: async (_profile) => ({ __kind__: "ok", ok: demoProfile }),
  saveLandRecord: async (_fieldId, _record) => ({ __kind__: "ok", ok: demoLandRecord }),
  snoozeNotification: async (_notifId, _until) => ({ __kind__: "ok", ok: true }),
  updateCropStage: async (_cropSeasonId, _stage) => ({ __kind__: "ok", ok: demoCropSeason }),
  updateFarm: async (_farmId, _updates) => ({ __kind__: "ok", ok: demoFarm }),
  updateField: async (_fieldId, _updates) => ({ __kind__: "ok", ok: demoField }),
  updateMemberRole: async (_farmId, _memberId, _newRole) => ({ __kind__: "ok", ok: demoMember }),
  _initializeAccessControl: async () => undefined,
};

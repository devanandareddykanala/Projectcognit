import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Field {
    id: bigint;
    shcExpiry?: Timestamp;
    soilType: string;
    irrigationType: string;
    name: string;
    createdAt: Timestamp;
    unit: string;
    landRecordRef?: string;
    surveyNumber?: string;
    isActive: boolean;
    geoPoints: Array<[number, number]>;
    ulpin?: string;
    areaSqm: bigint;
    tenure: string;
    shcNumber?: string;
    farmId: bigint;
}
export type Timestamp = bigint;
export type Result_2 = {
    __kind__: "ok";
    ok: Farm;
} | {
    __kind__: "err";
    err: string;
};
export type Result_17 = {
    __kind__: "ok";
    ok: ClassificationCode;
} | {
    __kind__: "err";
    err: string;
};
export type Result_13 = {
    __kind__: "ok";
    ok: CropMSP | null;
} | {
    __kind__: "err";
    err: string;
};
export interface AuditLog {
    id: bigint;
    action: string;
    entityId: string;
    timestamp: Timestamp;
    details: string;
    actorPrincipal: Principal;
    entityType: string;
    farmId: bigint;
}
export type Result_5 = {
    __kind__: "ok";
    ok: LandRecord;
} | {
    __kind__: "err";
    err: string;
};
export type Result_16 = {
    __kind__: "ok";
    ok: InviteToken;
} | {
    __kind__: "err";
    err: string;
};
export type Result_1 = {
    __kind__: "ok";
    ok: Field;
} | {
    __kind__: "err";
    err: string;
};
export type Result_4 = {
    __kind__: "ok";
    ok: boolean;
} | {
    __kind__: "err";
    err: string;
};
export type Result_11 = {
    __kind__: "ok";
    ok: Array<FarmMember>;
} | {
    __kind__: "err";
    err: string;
};
export interface CropSeason {
    id: bigint;
    isInterCrop: boolean;
    financialYear: string;
    actualYieldQt?: number;
    mspPerQuintal?: bigint;
    expectedHarvestDate: Timestamp;
    createdAt: Timestamp;
    season: string;
    stage: CropStage;
    parentCropId?: bigint;
    cropName: string;
    areaSqm: bigint;
    variety: string;
    expectedYieldQt?: number;
    farmId: bigint;
    sowingDate: Timestamp;
    fieldId: bigint;
}
export interface InviteToken {
    id: bigint;
    token: string;
    expiresAt: Timestamp;
    code: string;
    hmac: string;
    createdBy: Principal;
    role: MemberRole;
    moduleToggles: ModuleToggles;
    acceptedBy?: Principal;
    revokedAt?: Timestamp;
    farmId: bigint;
}
export interface ModuleToggles {
    finance: boolean;
    fisheries: boolean;
    poultry: boolean;
    labour: boolean;
    crops: boolean;
    greenhouse: boolean;
    solar: boolean;
    horticulture: boolean;
    dairy: boolean;
    machinery: boolean;
}
export interface ClassificationEntry {
    code: string;
    description: string;
    warnings: Array<string>;
    examples: Array<string>;
}
export type Result_7 = {
    __kind__: "ok";
    ok: CropHarvest;
} | {
    __kind__: "err";
    err: string;
};
export type Result_14 = {
    __kind__: "ok";
    ok: Array<AuditLog>;
} | {
    __kind__: "err";
    err: string;
};
export interface FarmMember {
    id: bigint;
    principal?: Principal;
    relation: string;
    lastActiveAt?: Timestamp;
    name: string;
    joinedAt: Timestamp;
    role: MemberRole;
    emoji: string;
    addedBy: Principal;
    moduleToggles: ModuleToggles;
    phone?: string;
    farmId: bigint;
}
export interface Farm {
    id: bigint;
    ownershipType: string;
    ownerPrincipal: Principal;
    ksId: string;
    name: string;
    createdAt: Timestamp;
    surveyNumber?: string;
    isDemo: boolean;
    purposes: Array<string>;
    totalAreaSqm: bigint;
    district: string;
    state: string;
    village: string;
    mandal: string;
}
export interface SaveLandRecordInput {
    pahaniNumber?: string;
    satbaraNumber?: string;
    bhudhaarNumber?: string;
    adangalNumber?: string;
    state: string;
    pattadarPassbook?: string;
    genericRecordNumber?: string;
    rtcNumber?: string;
}
export type Result_6 = {
    __kind__: "ok";
    ok: FarmerProfile;
} | {
    __kind__: "err";
    err: string;
};
export interface CropMSP {
    id: bigint;
    financialYear: string;
    mspPerQuintal: bigint;
    lastUpdated: Timestamp;
    season: string;
    cropName: string;
}
export interface UpdateFarmInput {
    ownershipType?: string;
    name?: string;
    surveyNumber?: string;
    purposes?: Array<string>;
    totalAreaSqm?: bigint;
    district?: string;
    village?: string;
    mandal?: string;
}
export type Result_9 = {
    __kind__: "ok";
    ok: LandRecord | null;
} | {
    __kind__: "err";
    err: string;
};
export type Result_12 = {
    __kind__: "ok";
    ok: Array<CropSeason>;
} | {
    __kind__: "err";
    err: string;
};
export interface CropHarvest {
    id: bigint;
    moisturePercent?: number;
    actualYieldQt: number;
    recordedBy: Principal;
    notes?: string;
    qualityGrade: QualityGrade;
    cropSeasonId: bigint;
    harvestDate: Timestamp;
}
export interface ClassificationCode {
    taxSection: string;
    code: string;
    incomeType: string;
    guidance: string;
}
export interface NotificationEntity {
    id: bigint;
    title: string;
    notifType: string;
    body: string;
    createdAt: Timestamp;
    soundType: string;
    isRead: boolean;
    snoozedUntil?: Timestamp;
    isDismissed: boolean;
    recipientPrincipal: Principal;
    farmId: bigint;
}
export type Result = {
    __kind__: "ok";
    ok: FarmMember;
} | {
    __kind__: "err";
    err: string;
};
export type Result_3 = {
    __kind__: "ok";
    ok: CropSeason;
} | {
    __kind__: "err";
    err: string;
};
export interface UpdateFieldInput {
    shcExpiry?: Timestamp;
    soilType?: string;
    irrigationType?: string;
    name?: string;
    unit?: string;
    surveyNumber?: string;
    geoPoints?: Array<[number, number]>;
    ulpin?: string;
    areaSqm?: bigint;
    tenure?: string;
    shcNumber?: string;
}
export type Result_10 = {
    __kind__: "ok";
    ok: Array<Field>;
} | {
    __kind__: "err";
    err: string;
};
export type Result_8 = {
    __kind__: "ok";
    ok: Array<NotificationEntity>;
} | {
    __kind__: "err";
    err: string;
};
export type Result_15 = {
    __kind__: "ok";
    ok: Array<InviteToken>;
} | {
    __kind__: "err";
    err: string;
};
export interface FarmerProfile {
    fssaiNumber?: string;
    principal: Principal;
    bankLast4?: string;
    gstNumber?: string;
    name: string;
    fpoMember: boolean;
    bankIfsc?: string;
    aadhaarBankLinked: boolean;
    mobile?: string;
    agristackId?: string;
    bankBranch?: string;
}
export interface LandRecord {
    id: bigint;
    pahaniNumber?: string;
    satbaraNumber?: string;
    bhudhaarNumber?: string;
    adangalNumber?: string;
    state: string;
    pattadarPassbook?: string;
    genericRecordNumber?: string;
    rtcNumber?: string;
    fieldId: bigint;
}
export enum CropStage {
    Germination = "Germination",
    GrainFilling = "GrainFilling",
    Sowing = "Sowing",
    Harvest = "Harvest",
    LandPrep = "LandPrep",
    PostHarvest = "PostHarvest",
    Vegetative = "Vegetative",
    Flowering = "Flowering"
}
export enum MemberRole {
    Member = "Member",
    ViewOnly = "ViewOnly",
    Admin = "Admin"
}
export enum QualityGrade {
    FAQ = "FAQ",
    GradeA = "GradeA",
    GradeB = "GradeB",
    Rejected = "Rejected",
    Processing = "Processing"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptInvite(code: string): Promise<Result_2>;
    addFarmMember(farmId: bigint, name: string, relation: string, emoji: string, phone: string | null, role: MemberRole, moduleToggles: ModuleToggles): Promise<Result>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    classifyIncome(module: string, itemType: string, marketChannel: string): Promise<Result_17>;
    createCropSeason(farmId: bigint, fieldId: bigint, cropName: string, variety: string, season: string, financialYear: string, areaSqm: bigint, sowingDate: Timestamp, expectedHarvestDate: Timestamp, mspPerQuintal: bigint | null, isInterCrop: boolean, parentCropId: bigint | null): Promise<Result_3>;
    createFarm(name: string, state: string, district: string, mandal: string, village: string, surveyNumber: string | null, totalAreaSqm: bigint, unit: string, ownershipType: string, purposes: Array<string>): Promise<Result_2>;
    createField(farmId: bigint, name: string, areaSqm: bigint, unit: string, soilType: string, irrigationType: string, tenure: string, surveyNumber: string | null, ulpin: string | null, shcNumber: string | null, shcExpiry: Timestamp | null, geoPoints: Array<[number, number]>): Promise<Result_1>;
    deleteField(fieldId: bigint): Promise<Result_4>;
    generateInvite(farmId: bigint, role: MemberRole, moduleToggles: ModuleToggles): Promise<Result_16>;
    getActiveInvites(farmId: bigint): Promise<Result_15>;
    getAllMSPRates(financialYear: string): Promise<Array<CropMSP>>;
    getAuditLog(farmId: bigint, limit: bigint): Promise<Result_14>;
    getCallerUserRole(): Promise<UserRole>;
    getClassificationCodes(): Promise<Array<ClassificationEntry>>;
    getCropMSP(cropName: string, season: string, financialYear: string): Promise<Result_13>;
    getCropSeasonsForFarm(farmId: bigint, financialYear: string): Promise<Result_12>;
    getCropSeasonsForField(fieldId: bigint): Promise<Result_12>;
    getDemoFarm(): Promise<Result_2>;
    getFarm(farmId: bigint): Promise<Result_2>;
    getFarmMembers(farmId: bigint): Promise<Result_11>;
    getFarmerProfile(): Promise<Result_6>;
    getFieldsForFarm(farmId: bigint): Promise<Result_10>;
    getLandRecord(fieldId: bigint): Promise<Result_9>;
    getNotifications(farmId: bigint): Promise<Result_8>;
    getUserFarms(): Promise<Array<Farm>>;
    isCallerAdmin(): Promise<boolean>;
    logHarvest(cropSeasonId: bigint, harvestDate: Timestamp, yieldQt: number, qualityGrade: QualityGrade, moisturePercent: number | null, notes: string | null): Promise<Result_7>;
    markNotificationRead(notifId: bigint): Promise<Result_4>;
    removeFarmMember(farmId: bigint, memberId: bigint): Promise<Result_4>;
    revokeInvite(farmId: bigint, inviteId: bigint): Promise<Result_4>;
    saveFarmerProfile(profile: FarmerProfile): Promise<Result_6>;
    saveLandRecord(fieldId: bigint, record: SaveLandRecordInput): Promise<Result_5>;
    snoozeNotification(notifId: bigint, until: Timestamp): Promise<Result_4>;
    updateCropStage(cropSeasonId: bigint, stage: CropStage): Promise<Result_3>;
    updateFarm(farmId: bigint, updates: UpdateFarmInput): Promise<Result_2>;
    updateField(fieldId: bigint, updates: UpdateFieldInput): Promise<Result_1>;
    updateMemberRole(farmId: bigint, memberId: bigint, newRole: MemberRole): Promise<Result>;
}

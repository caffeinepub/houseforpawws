import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Pet {
    id: string;
    age: string;
    photoBlobs: Array<ExternalBlob>;
    ownerId: Principal;
    name: string;
    size: string;
    tags: Array<string>;
    description: string;
    healthStatus: string;
    breed: string;
    species: string;
    location: string;
    isAdopted: boolean;
}
export type Time = bigint;
export interface PublicUserProfile {
    bio: string;
    displayName: string;
    profilePhoto?: ExternalBlob;
    location: string;
}
export interface MessageView {
    text: string;
    sender: Principal;
    timestamp: Time;
}
export interface Stats {
    totalPets: bigint;
    adoptedPets: bigint;
    totalUsers: bigint;
    totalConversations: bigint;
}
export type UserProfileResult = {
    __kind__: "publicView";
    publicView: PublicUserProfile;
} | {
    __kind__: "full";
    full: FullUserProfile;
};
export interface ConversationView {
    id: string;
    messages: Array<MessageView>;
    user1: Principal;
    user2: Principal;
}
export interface FullUserProfile {
    bio: string;
    displayName: string;
    profilePhoto?: ExternalBlob;
    email: string;
    phone: string;
    location: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminBanUser(user: Principal): Promise<void>;
    adminDeletePet(petId: string): Promise<void>;
    adminGetAllUsers(): Promise<Array<[Principal, FullUserProfile]>>;
    adminGetBannedUsers(): Promise<Array<Principal>>;
    adminGetStats(): Promise<Stats>;
    adminUnbanUser(user: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPet(pet: Pet): Promise<string>;
    deletePet(petId: string): Promise<void>;
    forceClaimAdminIfNoneExists(): Promise<boolean>;
    getAdoptedPets(isAdopted: boolean): Promise<Array<Pet>>;
    getAllPets(): Promise<Array<Pet>>;
    getCallerUserProfile(): Promise<FullUserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversationParticipants(conversationId: string): Promise<[Principal, Principal]>;
    getMessages(conversationId: string): Promise<Array<MessageView>>;
    getMyConversations(): Promise<Array<ConversationView>>;
    getPet(petId: string): Promise<Pet | null>;
    getPetsByLocation(location: string): Promise<Array<Pet>>;
    getPetsBySpecies(species: string): Promise<Array<Pet>>;
    getUserProfile(user: Principal): Promise<UserProfileResult | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: FullUserProfile): Promise<void>;
    sendMessage(conversationId: string, text: string): Promise<void>;
    startOrGetConversation(otherUser: Principal): Promise<string>;
    updatePet(petId: string, updatedPet: Pet): Promise<void>;
}

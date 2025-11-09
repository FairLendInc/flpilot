import { create } from "zustand";

export type State = {
	firstName: string | undefined;
	lastName: string | undefined;
	phone: string | undefined;
	activeOrganizationId: string | undefined;
	profilePictureUrl: string | undefined;
	email: string;
	emailVerified: boolean;
	orgMap: OrgMap;
};

export type Role = {
	slug: string;
	name: string | undefined;
	permissions: string[];
	createdAt: string | undefined;
	updatedAt: string | undefined;
};

export type Org = {
	organizationName: string;
	organizationExternalId: string | undefined;
	organizationMetadata: Record<string, unknown>;
	activeRole: Role;
	allRoles: Role[];
};

/**
 * @typedef {Object} OrgMap
 * @property {Record<string, Org>} - Mapping of organization IDs to Org objects
 */
export type OrgMap = Record<string, Org>;

type Actions = {
	setFirstName: (firstName: string) => void;
	setLastName: (lastName: string) => void;
	setPhone: (phone: string | undefined) => void;
	setActiveOrganizationId: (activeOrganizationId: string | undefined) => void;
	setProfilePictureUrl: (profilePictureUrl: string | undefined) => void;
	setEmail: (email: string) => void;
	setEmailVerified: (emailVerified: boolean) => void;
	setOrgMap: (orgMap: OrgMap) => void;
	setAllProfileData: (data: State) => void;
};

export const useUserProfileStore = create<State & Actions>((set) => ({
	firstName: undefined,
	lastName: undefined,
	phone: undefined,
	activeOrganizationId: undefined,
	profilePictureUrl: undefined,
	email: "",
	emailVerified: false,
	orgMap: {} as OrgMap,
	setFirstName: (firstName: string) => set({ firstName }),
	setLastName: (lastName: string) => set({ lastName }),
	setPhone: (phone: string | undefined) => set({ phone }),
	setActiveOrganizationId: (activeOrganizationId: string | undefined) =>
		set({ activeOrganizationId }),
	setProfilePictureUrl: (profilePictureUrl: string | undefined) =>
		set({ profilePictureUrl }),
	setEmail: (email: string) => set({ email }),
	setEmailVerified: (emailVerified: boolean) => set({ emailVerified }),
	setOrgMap: (orgMap: OrgMap) => set({ orgMap }),
	setAllProfileData: (data: State) => set(data),
}));

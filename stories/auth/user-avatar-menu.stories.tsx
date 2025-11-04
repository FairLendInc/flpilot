import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock UserAvatarMenu component for Storybook to avoid WorkOS crypto issues
function MockUserAvatarMenu({
	user,
	loading,
}: {
	user?: any;
	loading?: boolean;
}) {
	if (loading) {
		return (
			<div
				aria-label="Loading user"
				className="h-8 w-8 animate-pulse rounded-full bg-muted"
			/>
		);
	}

	const displayName = user
		? user.firstName && user.lastName
			? `${user.firstName} ${user.lastName}`
			: user.email || "User"
		: "Guest User";
	const email = user?.email ?? null;
	const imageUrl = user?.profilePictureUrl ?? null;
	const initials = user
		? displayName
				.split(/\s+/)
				.map((part: string) => part[0])
				.join("")
				.toUpperCase() || "U"
		: "GU";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger aria-label="Open user menu" asChild>
				<button className="inline-flex items-center justify-center rounded-full outline-hidden">
					<Avatar>
						{imageUrl ? (
							<AvatarImage alt={displayName} src={imageUrl} />
						) : (
							<AvatarFallback>{initials}</AvatarFallback>
						)}
					</Avatar>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={8}>
				<DropdownMenuLabel>
					<div className="flex min-w-40 flex-col">
						<span className="font-medium text-sm">{displayName}</span>
						{email ? (
							<span className="text-muted-foreground text-xs">{email}</span>
						) : null}
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
					Profile
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
					Admin Panel
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
					Logout
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const meta: Meta<typeof MockUserAvatarMenu> = {
	title: "Auth/UserAvatarMenu",
	component: MockUserAvatarMenu,
	parameters: {
		docs: {
			description: {
				component:
					"WorkOS-backed avatar with dropdown menu. This is a Storybook mock to avoid crypto issues - the real component uses WorkOS AuthKit.",
			},
		},
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="p-6">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Unauthenticated: Story = {
	args: {
		user: undefined,
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Renders the component without an authenticated user. Shows initials 'GU' and a dropdown with stubbed actions.",
			},
		},
	},
};

export const Loading: Story = {
	args: {
		loading: true,
	},
	parameters: {
		docs: {
			description: {
				story: "Shows the loading state with an animated skeleton.",
			},
		},
	},
};

export const AuthenticatedWithName: Story = {
	args: {
		user: {
			firstName: "John",
			lastName: "Doe",
			email: "john.doe@example.com",
			profilePictureUrl: null,
		},
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Authenticated user with first/last name and email. Shows initials 'JD'.",
			},
		},
	},
};

export const AuthenticatedWithImage: Story = {
	args: {
		user: {
			firstName: "Jane",
			lastName: "Smith",
			email: "jane.smith@example.com",
			profilePictureUrl:
				"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
		},
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story: "Authenticated user with profile picture, name, and email.",
			},
		},
	},
};

export const AuthenticatedEmailOnly: Story = {
	args: {
		user: {
			firstName: null,
			lastName: null,
			email: "user@example.com",
			profilePictureUrl: null,
		},
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Authenticated user with only email (no name). Shows first letter of email as initial.",
			},
		},
	},
};

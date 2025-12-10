"use client";

import { Card } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ERROR_MESSAGES } from "../constants";
import type { RolesPermissionsProps } from "../types";

export function RolesPermissions({
	memberships,
	activeOrganizationId,
	workosPermissions,
	workosOrgId,
	workosRole,
}: RolesPermissionsProps) {
	const activeMembershipData = memberships.find(
		(m) => m.organizationId === activeOrganizationId
	);

	const hasNoRoles =
		!activeMembershipData?.roleDetails ||
		activeMembershipData.roleDetails.length === 0;

	return (
		<Card.Root
			className="overflow-hidden rounded-2xl border-2 shadow-lg"
			data-testid="roles-permissions"
		>
			<Card.Header className="border-b bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-purple-600 to-pink-600">
						<Icon
							className="h-5 w-5 text-white"
							icon="gravity-ui:shield-check"
						/>
					</div>
					<div>
						<Card.Title className="text-xl">Roles & Permissions</Card.Title>
						<Card.Description>Your access and permissions</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content className="space-y-6 p-6">
				<div>
					<h3 className="mb-2 font-semibold text-lg">Active Organization</h3>
					<p className="text-muted-foreground">
						{activeOrganizationId
							? activeMembershipData?.organizationName ||
								ERROR_MESSAGES.NO_ORGANIZATION
							: ERROR_MESSAGES.NO_ORGANIZATION}
					</p>
				</div>

				{activeOrganizationId && !hasNoRoles && (
					<div>
						<h3 className="mb-3 font-semibold text-lg">Roles & Permissions</h3>
						<div className="space-y-4">
							{activeMembershipData.roleDetails.map((role) => {
								const isActiveRole =
									role.slug === activeMembershipData.primaryRoleSlug;

								// Use WorkOS permissions for the active role in the active organization
								const shouldUseWorkOSPermissions =
									isActiveRole &&
									workosOrgId === activeOrganizationId &&
									workosRole === role.slug;

								const displayPermissions = shouldUseWorkOSPermissions
									? workosPermissions
									: role.permissions;

								return (
									<div
										className={`rounded-lg border p-4 ${
											isActiveRole
												? "border-primary bg-primary/5"
												: "border-border"
										}`}
										key={role.slug}
									>
										<div className="mb-2 flex items-center gap-2">
											<h4 className="font-medium">{role.name}</h4>
											{isActiveRole && (
												<span className="rounded bg-primary px-2 py-1 text-primary-foreground text-xs">
													Active Role
												</span>
											)}
										</div>

										{displayPermissions && displayPermissions.length > 0 ? (
											<div className="mt-2">
												<p className="mb-2 text-muted-foreground text-sm">
													Permissions:
												</p>
												<ul className="space-y-1">
													{displayPermissions.map((permission: string) => (
														<li
															className="flex items-center gap-2 text-sm"
															key={permission}
														>
															<Icon
																className="h-4 w-4 shrink-0 text-green-600"
																icon="gravity-ui:check"
															/>
															<span className="font-mono text-xs">
																{permission}
															</span>
														</li>
													))}
												</ul>
											</div>
										) : (
											<p className="mt-2 text-muted-foreground text-sm italic">
												{ERROR_MESSAGES.NO_PERMISSIONS}
											</p>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}

				{hasNoRoles && (
					<div>
						<h3 className="mb-2 font-semibold text-lg">Roles & Permissions</h3>
						<p className="text-muted-foreground">
							{ERROR_MESSAGES.NO_ROLES_ASSIGNED}
						</p>
					</div>
				)}
			</Card.Content>
		</Card.Root>
	);
}

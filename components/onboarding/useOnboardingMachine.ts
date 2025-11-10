"use client";

import { useEffect, useState } from "react";
import { createActor, type SnapshotFrom } from "xstate";
import { type JourneyDoc, onboardingMachine } from "./machine";

export function useOnboardingMachine(journey: JourneyDoc | null | undefined) {
	const [actor] = useState(() => createActor(onboardingMachine));
	const [snapshot, setSnapshot] = useState<
		SnapshotFrom<typeof onboardingMachine>
	>(actor.getSnapshot());

	useEffect(() => {
		actor.start();
		const sub = actor.subscribe((next) => {
			setSnapshot(next);
		});
		return () => {
			sub.unsubscribe();
			actor.stop();
		};
	}, [actor]);

	useEffect(() => {
		actor.send({
			type: "HYDRATE",
			journey: journey ?? null,
		});
	}, [actor, journey]);

	return { snapshot, send: actor.send };
}

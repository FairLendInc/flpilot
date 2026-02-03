/**
 * Validation result for step data
 */
export type ValidationResult = {
	valid: boolean;
	errors?: Record<string, string>;
};

/**
 * Result from persisting step data
 */
export type PersistResult<T = unknown> = {
	success: boolean;
	data?: T;
	error?: string;
};

/**
 * Context passed to step persistence function
 */
export type PersistContext = {
	journeyId: string;
	userId: string;
	stepId: string;
	// Abstract persistence function - implementation agnostic
	persistFn: (stepId: string, data: unknown) => Promise<void>;
};

/**
 * Step definition interface
 * All onboarding steps must implement this interface
 */
export type OnboardingStep<TData = unknown> = {
	/** Unique step identifier */
	id: string;
	/** Display name for the step */
	name: string;
	/** Step description/tooltip */
	description?: string;
	/** Whether this step is required to complete onboarding */
	isRequired: boolean;
	/** Whether the user can skip this step */
	allowSkip: boolean;
	/**
	 * Validate step data before allowing advancement
	 * Returns validation result with optional field-level errors
	 */
	validate: (data: TData) => ValidationResult | Promise<ValidationResult>;
	/**
	 * Persist step data to storage
	 * Returns the data to be stored in the journey context
	 */
	persist: (
		data: TData,
		context: PersistContext
	) => Promise<PersistResult<TData>>;
	/**
	 * Get the initial/default data for this step
	 * Used when creating a new journey or resetting a step
	 */
	getInitialData: () => TData;
	/**
	 * Check if this step should be shown based on journey context
	 * Used for conditional steps (e.g., KYC for FairLend only)
	 */
	shouldShow?: (context: JourneyContext) => boolean;
};

/**
 * Journey context passed to steps for conditional logic
 */
export type JourneyContext = {
	persona: "broker" | "investor" | "lawyer" | "borrower";
	brokerId?: string;
	brokerCode?: string;
	configVersion: number;
	stepData: Record<string, unknown>;
	// Borrower-specific context
	invitation?: {
		invitedBy: string;
		invitedByRole: "broker" | "admin";
	};
};

/**
 * Step configuration for a specific broker type or journey type
 */
export type StepConfiguration = {
	/** Configuration identifier (e.g., "fairlend", "external_broker") */
	configId: string;
	/** Ordered list of step IDs */
	stepOrder: string[];
	/** Step-specific settings */
	stepSettings: Record<string, StepSettings>;
	/** Configuration version for migration handling */
	version: number;
};

/**
 * Settings for an individual step
 */
export type StepSettings = {
	isRequired: boolean;
	allowSkip: boolean;
	/** Custom fields specific to this step configuration */
	customFields?: Record<string, unknown>;
};

/**
 * Step registry - central registry for all onboarding steps
 * Implements the swappable step architecture
 */
export class StepRegistry {
	private readonly steps = new Map<string, OnboardingStep>();
	private readonly configurations = new Map<string, StepConfiguration>();

	/**
	 * Register a step definition
	 */
	registerStep(step: OnboardingStep): void {
		if (this.steps.has(step.id)) {
			console.warn(`Step ${step.id} is already registered. Overwriting.`);
		}
		this.steps.set(step.id, step);
	}

	/**
	 * Register multiple steps at once
	 */
	registerSteps(steps: OnboardingStep[]): void {
		for (const step of steps) {
			this.registerStep(step);
		}
	}

	/**
	 * Get a step by ID
	 */
	getStep(id: string): OnboardingStep | undefined {
		return this.steps.get(id);
	}

	/**
	 * Check if a step exists
	 */
	hasStep(id: string): boolean {
		return this.steps.has(id);
	}

	/**
	 * Get all registered step IDs
	 */
	getStepIds(): string[] {
		return Array.from(this.steps.keys());
	}

	/**
	 * Register a step configuration
	 */
	registerConfiguration(config: StepConfiguration): void {
		this.configurations.set(config.configId, config);
	}

	/**
	 * Get a step configuration by ID
	 */
	getConfiguration(configId: string): StepConfiguration | undefined {
		return this.configurations.get(configId);
	}

	/**
	 * Get the ordered list of steps for a configuration
	 * Filters out steps that don't exist in the registry
	 */
	getOrderedSteps(configId: string): OnboardingStep[] {
		const config = this.configurations.get(configId);
		if (!config) {
			throw new Error(`Configuration ${configId} not found`);
		}

		return config.stepOrder
			.map((stepId) => this.steps.get(stepId))
			.filter((step): step is OnboardingStep => step !== undefined);
	}

	/**
	 * Get step settings for a specific configuration
	 */
	getStepSettings(configId: string, stepId: string): StepSettings | undefined {
		const config = this.configurations.get(configId);
		return config?.stepSettings[stepId];
	}

	/**
	 * Get the next step ID in the configuration
	 */
	getNextStepId(configId: string, currentStepId: string): string | undefined {
		const config = this.configurations.get(configId);
		if (!config) return;

		const currentIndex = config.stepOrder.indexOf(currentStepId);
		if (currentIndex === -1 || currentIndex >= config.stepOrder.length - 1) {
			return;
		}

		return config.stepOrder[currentIndex + 1];
	}

	/**
	 * Get the previous step ID in the configuration
	 */
	getPreviousStepId(
		configId: string,
		currentStepId: string
	): string | undefined {
		const config = this.configurations.get(configId);
		if (!config) return;

		const currentIndex = config.stepOrder.indexOf(currentStepId);
		if (currentIndex <= 0) {
			return;
		}

		return config.stepOrder[currentIndex - 1];
	}

	/**
	 * Check if a step is the last step in the configuration
	 */
	isLastStep(configId: string, stepId: string): boolean {
		const config = this.configurations.get(configId);
		if (!config) return false;

		const index = config.stepOrder.indexOf(stepId);
		return index === config.stepOrder.length - 1;
	}

	/**
	 * Get all configuration IDs
	 */
	getConfigurationIds(): string[] {
		return Array.from(this.configurations.keys());
	}

	/**
	 * Clear all registrations (useful for testing)
	 */
	clear(): void {
		this.steps.clear();
		this.configurations.clear();
	}
}

// Global step registry instance
export const globalStepRegistry = new StepRegistry();

/**
 * Determine which configuration to use based on journey context
 */
export function determineConfigurationId(context: {
	persona: "broker" | "investor" | "lawyer" | "borrower";
	brokerId?: string;
	brokerCode?: string;
}): string {
	if (context.persona === "investor") {
		// For investors, use broker-specific config if available
		// Otherwise default to fairlend or external_broker
		if (context.brokerId) {
			// Check if there's a specific config for this broker
			// Otherwise determine based on whether it's FairLend
			return "fairlend"; // TODO: Check if broker is FairLend
		}
		return "fairlend";
	}

	if (context.persona === "borrower") {
		// Borrowers use a single configuration
		// Future: Could differentiate by invitation type
		return "borrower";
	}

	// For other personas, use persona-specific config
	return context.persona;
}

/**
 * Create a default step configuration
 */
export function createDefaultStepConfiguration(
	configId: string,
	stepOrder: string[],
	options: {
		version?: number;
		defaultSettings?: Partial<StepSettings>;
	} = {}
): StepConfiguration {
	const { version = 1, defaultSettings = {} } = options;

	const stepSettings: Record<string, StepSettings> = {};
	for (const stepId of stepOrder) {
		stepSettings[stepId] = {
			isRequired: true,
			allowSkip: false,
			...defaultSettings,
		};
	}

	return {
		configId,
		stepOrder,
		stepSettings,
		version,
	};
}

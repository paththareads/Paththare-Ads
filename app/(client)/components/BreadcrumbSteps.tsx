"use client";

interface BreadcrumbStepsProps {
  steps: string[];
  currentStep: number;
}

export default function BreadcrumbSteps({
  steps,
  currentStep,
}: BreadcrumbStepsProps) {
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="w-full">
      {/* ✅ MOBILE VIEW (Progress Bar) */}
      <div className="md:hidden w-full px-4 mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-accent-high h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-center mt-2">
          <p className="text-xs text-gray-500">
            Step {currentStep} of {steps.length}
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {steps[currentStep - 1]}
          </p>
        </div>
      </div>

      {/* ✅ DESKTOP VIEW (Breadcrumb Steps) */}
      <nav
        aria-label="Progress steps"
        className="hidden md:flex mt-8 w-full justify-center"
      >
        <ol className="flex items-center justify-center gap-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <li key={index} className="flex items-center">
                <span
                  className={`inline-flex items-center rounded-full px-4 py-2 text-base font-medium transition
                    ${
                      isActive
                        ? "bg-primary-accent text-white shadow-sm"
                        : isCompleted
                          ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                          : "bg-gray-200 text-gray-700"
                    }
                  `}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span className="mr-1 font-semibold">{stepNumber}.</span>
                  {step}
                </span>

                {/* Divider */}
                {index < steps.length - 1 && (
                  <span aria-hidden="true" className="mx-3 text-gray-400">
                    ›
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

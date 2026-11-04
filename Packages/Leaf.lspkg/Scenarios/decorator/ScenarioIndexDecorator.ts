/**
 * LEAF Framework - scenariosIndex Decorator
 */
export function scenariosIndex(scenarios: any[]): ClassDecorator {
    return (target: any) => {
        (target as any).registeredScenarios = scenarios;
        return target;
    };
}


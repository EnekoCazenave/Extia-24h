export function computeScore(config, input) {
    if (config.type === 'BOOLEAN' && input.calculType === 'BOOLEAN') {
        return input.value ? config.trueValue : config.falseValue;
    }
    if (config.type === 'NUMBER' && input.calculType === 'NUMBER') {
        return Math.round(input.value * config.multiplier);
    }
    if (config.type === 'TIME' && input.calculType === 'TIME') {
        const sorted = [...config.tiers].sort((a, b) => a.timeSeconds - b.timeSeconds);
        const tier = sorted.find((t) => input.timeSeconds <= t.timeSeconds);
        return tier ? tier.points : 0;
    }
    throw new Error('CALCUL_TYPE_MISMATCH');
}
//# sourceMappingURL=scoring.js.map

export async function processBatchesSequential(chatFn, batches, options = {}) {
    const allResponses = [];
    for (const batch of batches) {
        const promises = batch.map(p => chatFn(p,options).catch(err => ({ error: String(err) })));
        const responses = await Promise.all(promises);
        allResponses.push(...responses);
    }
    return allResponses;
}
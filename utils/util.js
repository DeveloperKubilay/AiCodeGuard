
export async function processBatchesSequential(chatFn, batches) {
    const allResponses = [];
    for (const batch of batches) {
        const promises = batch.map(p => chatFn(p).catch(err => ({ error: String(err) })));
        const responses = await Promise.all(promises);
        allResponses.push(...responses);
    }
    return allResponses;
}
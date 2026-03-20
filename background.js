chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
chrome.action.onClicked.addListener((tab) => { chrome.sidePanel.open({ tabId: tab.id }); });
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try { const tab = await chrome.tabs.get(tabId); chrome.storage.session.set({ activeContext: detectTool(tab.url || '') }); } catch(e) {}
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') chrome.storage.session.set({ activeContext: detectTool(tab.url || '') });
});
function detectTool(url) {
  if (url.includes('databricks.com') || url.includes('azuredatabricks')) return 'databricks';
  if (url.includes('powerbi.com')) return 'powerbi';
  if (url.includes('snowflake')) return 'snowflake';
  if (url.includes('netsuite.com')) return 'netsuite';
  if (url.includes('synapse') || url.includes('azure.com')) return 'synapse';
  return 'databricks';
}

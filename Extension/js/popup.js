$(document).ready(e => {
    openLastWindow();
});

function openLastWindow(){
    return new Promise(resolve => {
        chrome.storage.local.get(["lastWindow"], function (chromeData){
            let lastWindow = chromeData.lastWindow;
            if(lastWindow){
                openWindow(lastWindow);
            } else {
                openWindow("recent");
            }
            $(".windowTitle").click(function() {
                let windowName = $(this).attr("openWindow");
                log(windowName);
                openWindow(windowName)
            });
        }); 
    })
}

function openWindow(windowName){
    $(".cp-body").hide();
    $(".windowTitle").removeClass("active");
    $(`#${windowName}WindowTitle`).addClass("active");
    $(`#${windowName}ProductWindow`).show();
    $(`#${windowName}-0`).trigger( "click" );
    chrome.storage.local.set({ lastWindow: windowName });
    chrome.storage.local.set({ lastSelectedId: "" });
}
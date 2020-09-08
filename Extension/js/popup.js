$(document).ready(e => {
    openLastWindow();
    $("#feedbackform").submit(async (e) => {
        e.preventDefault();
        // console.log($("#feedbackform").serialize());
        let sendFeddbackResponse = await getHttp(`${URL}feedback`, "POST", $("#feedbackform").serialize());
        console.log(sendFeddbackResponse);
        if(sendFeddbackResponse.error == 0){
            showFeedbackResponse("success", "Thanks for your feedback!");
        } else {
            showFeedbackResponse("error", "Something went wrong!");
        }
        $("#feedbackform")[0].reset();

        chrome.identity.getAuthToken({interactive: true}, async function(token) {
            console.log(token);
            let url = `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`;
            let details = await getHttp(url);
            console.log(details);
            chrome.identity.getProfileUserInfo(function(userInfo) {
                console.log(userInfo);
            });
        });
    });
});

function showFeedbackResponse(type, message){
    let append = `<h4 class="text-center text-${type}">${message}</h4>`;
    $("#feedback_message").show();
    $("#feedback_message").append(append).fadeOut(5000, () => {
        $("#feedback_message").html("");
    });
}

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
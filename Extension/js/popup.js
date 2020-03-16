$(document).ready(e => {
    let lastWindow = sessionStorage.getItem("lastWindow");
    if(lastWindow){
        openWindow(lastWindow);
    } else {
        openWindow("recent");
    }
    $(".windowTitle").click(function() {
        let windowName = $(this).attr("openWindow");
        console.log(windowName);
        openWindow(windowName)
    });
});

function openWindow(windowName){
    $(".cp-body").hide();
    $(".windowTitle").removeClass("active");
    $(`#${windowName}WindowTitle`).addClass("active");
    $(`#${windowName}ProductWindow`).show();
    sessionStorage.setItem("lastWindow", windowName);
}
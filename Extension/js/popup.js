drawProducts();
$(function() {
  chrome.storage.sync.get(["total", "limit"], function(budget) {
    $("#total").text(budget.total);
    $("#limit").text(budget.limit);
  });

  $("#spendAmount").click(function() {
    var newTotal = 0;
    chrome.storage.sync.get(["total", "limit"], function(budget) {
      if (budget.total > 0) {
        newTotal += parseInt(budget.total);
      }

      var amount = $("#amount").val();
      if (amount) {
        newTotal += parseInt(amount);
      }

      if (amount && newTotal > budget.limit) {
        var notifOptions = {
          type: "basic",
          iconUrl: "../icons/cherries-48.png",
          title: "Limit Reached!",
          message: "Uh Oh! Looks like you've reached your limit!"
        };
        chrome.notifications.create("limitNotify", notifOptions);
      }

      chrome.storage.sync.set({ total: newTotal });
      $("#total").text(newTotal);
      $("#amount").val("");
    });
  });
});

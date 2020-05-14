$(function() {
    var f = $(".hfill");
    var originalWidth = f.width();
    $(window).on("resize", function() {
      f.width(originalWidth);
      requestAnimationFrame(function() {
        f.width(f.parent().width() + f.parent().offset().left - f.offset().left -1);
      });
    });

    $(".hfill").css('background-color', 'red')
});

/* This needs to be used with:

<p style="text-align:justify;">
    Here is some more text. Here is some more text. Here is some more text.
    Make something amazing! <span class="hfill" style="display:inline-block;height:40px">Here</span><br> is some more text.
    Here is some more text. Here is some more text. Here is some more text. Here is some more text. Here is some more text.
</p>

Then we can calculate stretches inside the hfill element.

*/
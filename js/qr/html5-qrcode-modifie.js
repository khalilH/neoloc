(function($) {
    jQuery.fn.extend({
        html5_qrcode: function(qrcodeSuccess, qrcodeError, videoError) {
            return this.each(function() {
                var currentElem = $(this);

                var height = currentElem.height();
                var width = currentElem.width();

                if (height == null) {
                    height = 250;
                }

                if (width == null) {
                    width = 300;
                }

                // var canvasElem = $('<canvas id="qr-canvas" width="' + (width - 2) + 'px" height="' + (height - 2) + 'px" style="display:none;"></canvas>').appendTo(currentElem);
                //
                // var canvas = canvasElem[0];
                // var context = canvas.getContext('2d');

                // var scan = function() {
                //     if (localMediaStream) {
                //         context.drawImage(video, 0, 0, 307, 250);
                //
                //         try {
                //             qrcode.decode();
                //         } catch (e) {
                //             qrcodeError(e, localMediaStream);
                //         }
                //
                //         $.data(currentElem[0], "timeout", setTimeout(scan, 500));
                //
                //     } else {
                //         $.data(currentElem[0], "timeout", setTimeout(scan, 500));
                //     }
                // };//end snapshot function

                // Call the getUserMedia method with our callback functions
                // if (navigator.getUserMedia) {
                //     navigator.getUserMedia({video: true}, successCallback, function(error) {
                //         videoError(error, localMediaStream);
                //     });
                // } else {
                //     console.log('Native web camera streaming (getUserMedia) not supported in this browser.');
                //     // Display a friendly "sorry" message to the user
                //     alert("Native web camera streaming (getUserMedia) not supported in this browser.");
                // }

                qrcode.callback = function (result) {
                    qrcodeSuccess(result);
                };
            }); // end of html5_qrcode
        },
        html5_qrcode_stop: function() {
            return this.each(function() {
                //stop the stream and cancel timeouts
                $(this).data('stream').getVideoTracks().forEach(function(videoTrack) {
                    videoTrack.stop();
                });

                clearTimeout($(this).data('timeout'));
            });
        }
    });
})(jQuery);

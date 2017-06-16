var reader;
var readSuccess = function (data) {
  $('#plaque').html(data)
};

var readError = function (error) {
  console.log('readError -> '+error);
};

var videoLoadError = function (videoError) {
  alert('videoLoadError -> '+videoError);
};

function reset() {
  $('#plaque').html("");
}

function decode() {
  var canvas = document.getElementById('qr-canvas')
  var context = canvas.getContext('2d');
  var img = document.getElementById('img');

  // context.drawImage(img, 0, 0);
  context.drawImage(img, 0, 0, 300, 300);

  try {
      qrcode.decode();
  } catch (e) {
      qrcodeError(e, localMediaStream);
  }
}

$(document).ready(function() {
  $('#zzz').html5_qrcode(readSuccess, readError, videoLoadError);

  $("#imgInput").change(function(){
    if (this.files && this.files[0]) {
      reader = new FileReader();

      reader.onload = function(e) {
        $('#img').attr('src', e.target.result);
      }

      reader.readAsDataURL(this.files[0]);

    }
  });

});

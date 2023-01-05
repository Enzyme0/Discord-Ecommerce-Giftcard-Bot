const { QRCodeStyling } = require("qr-code-styling-node/lib/qr-code-styling.common.js");
const nodeCanvas = require("canvas");
const { JSDOM } = require("jsdom");
const fs = require("fs");
const sharp = require("sharp");
const canvas = require("canvas");





module.exports = { getQr };

/*
{
        width: 512,
        height: 512,
        data: data,
        image: "https://commons.wikimedia.org/wiki/File:Bitcoin_logo.svg#/media/File:Bitcoin.svg",
        margin: 0,
        qrOptions: {
            typeNumber: "0",
            mode: "Byte",
            errorCorrectionLevel: "Q"
        },
        imageOptions: {
            hideBackgroundDots: true,
            imageSize: 0.4,
            margin: 0
        },
        dotsOptions: {
            type: "dots",
            color: "#6a1a4c",
            gradient: {
                type: "linear",
                rotation: 0,
                colorStops: [
                    {
                        offset: 0,
                        color: "#000000"
                    },
                    {
                        offset: 1,
                        color: "#f7931a"
                    }
                ]
            }
        },
        backgroundOptions: {
            color: "#ffffff"
        }
    }
*/


//add extra rounded corners
function options(data, image) {

    //split data to find the type of crypto e.g (bitcoin, ethereum, litecoin, etc)
    const crypto = data.split(":")[0];
return {
        width: 1024,
        height: 1024,
        data: data,
        image: image,
        margin: 0,
        qrOptions: {
            typeNumber: "0",
            mode: "Byte",
            errorCorrectionLevel: "Q"
        },
        imageOptions: {
            hideBackgroundDots: true,
            imageSize: 0.4,
            margin: 0
        },
        dotsOptions: {
            type: "dots",
            color: "#6a1a4c",
            gradient: gradientBuilder(crypto)
        },
        backgroundOptions: {
            color: "#ffffff"
        },
        cornersSquareOptions: {
            type: "extra-rounded",
            color: "#000000"
        },
        cornersDotOptions: {
            type: "none"
        }
    }
}


//new function that creates a new qr code and returns the file path, then deletes the file after 10 seconds
//ads some random numbers to the file name to prevent overwriting
//returns the file path relative to the root directory
//adds them to the path ./qrcodes/
async function getNewQr(data, image)
{
    const qrCodeImage = new QRCodeStyling({
        nodeCanvas, // this is required
        ...options(data, image)
    });
    
    //generate a file path
    //the folder is helpers/qrcodes

    const buffer = await qrCodeImage.getRawData("png") 
    //remember this is relative to the root directory, so we need to add  helpers/qrcodes/ to the beginning
    return buffer;
}

// For png type


// For svg typ

//q: how do i just base64 the entire thing? i dont want to save it to a file
//a: you can't, you have to save it to a file and then read it back in as a base64 string, then delete the file
//q: lets do that
 


function gradientBuilder(crypto)
{
    switch(crypto)
    {
        case "bitcoin":
            return {
                type: "linear",
                rotation: 0,
                colorStops: [
                    {
                        offset: 0,
                        color: "#000000"
                    },
                    {
                        offset: 1,
                        color: "#f7931a"
                    }
                ]
            }
        case "ethereum":
            return {
                type: "linear",
                rotation: 0,
                colorStops: [
                    {
                        offset: 0,
                        color: "#000000"
                    },
                    {
                        offset: 1,
                        color: "#8c8c8c"
                    }
                ]
            }
        case "litecoin":
            return {
                type: "linear",
                rotation: 0,
                colorStops: [
                    {
                        offset: 0,
                        color: "#000000"
                    },
                    {
                        offset: 1,
                        color:  "#345D9D"
                    }
                ]
            }
        default:
            return {
                type: "linear",
                rotation: 0,
                colorStops: [
                    {
                        offset: 0,
                        color: "#000000"
                    },
                    {
                        offset: 1,
                        color: "#f7931a"
                    }
                ]
            }
    }

}







function roundedImage(x, y, width, height, radius, ctx) {
    x = 0
    y = 0
    radius = 75
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

//master qr function, returns an awesome rounded qr code

async function getQr(data, image) {
    let qrCanvas = new canvas.createCanvas(1024, 1024);
    const ctx = qrCanvas.getContext("2d");
  
    return new Promise(async (resolve, reject) => {
      // get qr using existing function
      const path = await getNewQr(data, image);
      // path but add 2.png to the end instead of .png
      const img = new canvas.Image();

      // get the image data like height, and width
      img.onload = () => {
        roundedImage(0, 0, 1024, 1024, 75, ctx);
        ctx.clip();
        ctx.drawImage(img, 0, 0, 1024, 1024);
        //q: whats the syntax to get tyhe buffer from the canvas
        resolve(qrCanvas.toBuffer());
        //after 10 seconds delete the file
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.src = path;
    });
  }  


  //q: how do i make the function above just resolve the buffer instead of saving it to a file and then reading it back in
    //a: you can't, you have to save it to a file and then read it back in as a base64 string, then delete the file
    //q: that is not true, i can just resolve the buffer

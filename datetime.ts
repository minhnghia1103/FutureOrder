//Chuyển từ timestamp 13 ký tự sang datetime
let timestampMs = 1720414800;
let dateFromMs = new Date(timestampMs);

// Định dạng thành DD/MM/YY HH:MM:SS
let formattedDateTimeMs = dateFromMs.getDate().toString().padStart(2, '0') + '/' +
                          (dateFromMs.getMonth() + 1).toString().padStart(2, '0') + '/' +
                          dateFromMs.getFullYear().toString().slice(-2) + ' ' +
                          dateFromMs.getHours().toString().padStart(2, '0') + ':' +
                          dateFromMs.getMinutes().toString().padStart(2, '0') + ':' +
                          dateFromMs.getSeconds().toString().padStart(2, '0');

console.log(formattedDateTimeMs); // Output: DD/MM/YY HH:MM:SS

// //Chuyển từ timestamp 10 ký tự sang datetime
// let timestampSec = 1720414800;
// let timestampMsFromSec = timestampSec * 1000;
// let dateFromSec = new Date(timestampMsFromSec);

// // Định dạng thành DD/MM/YY HH:MM:SS
// let formattedDateTimeSec = dateFromSec.getDate().toString().padStart(2, '0') + '/' +
//                            (dateFromSec.getMonth() + 1).toString().padStart(2, '0') + '/' +
//                            dateFromSec.getFullYear().toString().slice(-2) + ' ' +
//                            dateFromSec.getHours().toString().padStart(2, '0') + ':' +
//                            dateFromSec.getMinutes().toString().padStart(2, '0') + ':' +
//                            dateFromSec.getSeconds().toString().padStart(2, '0');

// console.log(formattedDateTimeSec); // Output: DD/MM/YY HH:MM:SS

// document.getElementById("count-el").innerText = 10
let countEl = document.getElementById("count-el");
let saveEl = document.getElementById("save-el");
let count = 0;
// console.log(saveEl)
function increment() {
  count += 1;
  countEl.textContent = count;
}
// save function operation's after hititng the save button
function save() {
  let countStr = count + " - ";
  saveEl.textContent += countStr;
  countEl.textContent = 0;
  count = 0;
}
// save()
console.log("let's count people on subway !");

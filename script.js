const GRID=10

let grid=[]
let words=[]
let foundWords=[]
let wordColors={}
let wordIndex=0
let timer=0
let timerInterval
let selecting=false
let path=[]

let musicOn=true
let soundOn=true
let musicInterval=null

let audioCtx=new (window.AudioContext||window.webkitAudioContext)()

function tone(freq,time){
if(!soundOn)return
let osc=audioCtx.createOscillator()
let gain=audioCtx.createGain()

osc.frequency.value=freq
osc.type="square"

osc.connect(gain)
gain.connect(audioCtx.destination)

osc.start()
gain.gain.setValueAtTime(.2,audioCtx.currentTime)
gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+time)

osc.stop(audioCtx.currentTime+time)
}

function clickSound(){tone(400,.05)}
function successSound(){tone(800,.2)}
function endSound(){tone(200,.5)}

function startMusic(){

if(!musicOn)return

if(musicInterval)return

let seq=[262,330,392,523]

let i=0

musicInterval=setInterval(()=>{
if(!musicOn)return
tone(seq[i%seq.length],.15)
i++
},400)

}

function toggleMusic(){
musicOn=!musicOn
let btn=document.getElementById("musicBtn")
btn.classList.toggle("off",!musicOn)
btn.textContent=musicOn?"音乐":"音乐"
}

function toggleSound(){
soundOn=!soundOn
let btn=document.getElementById("soundBtn")
btn.classList.toggle("off",!soundOn)
btn.textContent=soundOn?"音效":"音效"
}

document.getElementById("musicBtn").onclick=toggleMusic
document.getElementById("soundBtn").onclick=toggleSound


function createEmptyGrid(){

let g=document.getElementById("grid")
g.innerHTML=""

for(let i=0;i<GRID*GRID;i++){

let c=document.createElement("div")
c.className="cell"
c.dataset.i=i

g.appendChild(c)

}

let cells=document.querySelectorAll(".cell")
for(let cell of cells){
cell.className="cell"
cell.style=""
}

document.getElementById("words").innerHTML=""

wordColors={}
wordIndex=0

}

createEmptyGrid()

function randomLetter(){
return String.fromCharCode(97+Math.floor(Math.random()*26))
}

function generateGrid(){

grid=[]

for(let r=0;r<GRID;r++){
grid[r]=[]
for(let c=0;c<GRID;c++)grid[r][c]=""
}

for(let word of words){

let placed=false

while(!placed){

let horizontal=Math.random()<.5

let r=Math.floor(Math.random()*GRID)
let c=Math.floor(Math.random()*GRID)

if(horizontal){

if(c+word.length>GRID)continue

let ok=true

for(let i=0;i<word.length;i++){
if(grid[r][c+i]&&grid[r][c+i]!=word[i])ok=false
}

if(!ok)continue

for(let i=0;i<word.length;i++)
grid[r][c+i]=word[i]

placed=true

}else{

if(r+word.length>GRID)continue

let ok=true

for(let i=0;i<word.length;i++){
if(grid[r+i][c]&&grid[r+i][c]!=word[i])ok=false
}

if(!ok)continue

for(let i=0;i<word.length;i++)
grid[r+i][c]=word[i]

placed=true

}

}

}

for(let r=0;r<GRID;r++)
for(let c=0;c<GRID;c++)
if(!grid[r][c])
grid[r][c]=randomLetter()

renderGrid()

}

function renderGrid(){

let cells=document.querySelectorAll(".cell")

for(let r=0;r<GRID;r++)
for(let c=0;c<GRID;c++){

let i=r*GRID+c
cells[i].textContent=grid[r][c]

}

}

function selectWords(){

let bank=JSON.parse(localStorage.getItem("words")||"[]")

if(!bank||bank.length===0)return false

let count=5+Math.floor(Math.random()*6)

let arr=[...bank].sort(()=>Math.random()-.5)

words=arr.slice(0,count)

foundWords=[]
wordColors={}
wordIndex=0

renderWordList()

return true

}

function renderWordList(){

let w=document.getElementById("words")
w.innerHTML=""

for(let i=0;i<words.length;i++){
let word=words[i]
let colorIndex=i%10

wordColors[word]=colorIndex

let e=document.createElement("div")
e.className="word color-"+colorIndex
e.id="w_"+word
e.textContent=word

w.appendChild(e)

}

}

function startGame(){

clearInterval(timerInterval)

selecting=false
path=[]

let success=selectWords()

if(!success){
alert("请先导入单词")
return
}

generateGrid()

timer=0
document.getElementById("time").textContent=0

timerInterval=setInterval(()=>{
timer++
document.getElementById("time").textContent=timer
},1000)

if(window.speechSynthesis){
window.speechSynthesis.getVoices()
}

}

document.getElementById("startBtn").onclick=startGame


document.getElementById("grid").addEventListener("pointerdown",e=>{

if(!e.target.classList.contains("cell"))return

selecting=true
path=[]

addCell(e.target)

})

document.addEventListener("pointerup",finishSelect)

document.getElementById("grid").addEventListener("pointermove",e=>{

if(!selecting)return

let el=document.elementFromPoint(e.clientX,e.clientY)

if(el&&el.classList.contains("cell"))addCell(el)

})

function addCell(cell){

if(path.includes(cell))return

if(path.length>=2){
let first=path[0]
let last=path[path.length-1]
let firstI=parseInt(first.dataset.i)
let lastI=parseInt(last.dataset.i)
let cellI=parseInt(cell.dataset.i)

let firstR=Math.floor(firstI/GRID)
let firstC=firstI%GRID
let lastR=Math.floor(lastI/GRID)
let lastC=lastI%GRID
let cellR=Math.floor(cellI/GRID)
let cellC=cellI%GRID

let dr=lastR-firstR
let dc=lastC-firstC

if(dr!==0&&dc!==0){

if(Math.abs(dr)>=Math.abs(dc)){
dc=0
}else{
dr=0
}
}

let newDr=cellR-lastR
let newDc=cellC-lastC

if(dr===0&&dc===0){

if(newDr!==0&&newDc!==0) return
}else{

if((dr===0&&newDr!==0)||(dc===0&&newDc!==0)) return

if(dr!==0&&newDr/dr<0) return
if(dc!==0&&newDc/dc<0) return
}
}

cell.classList.add("active")
path.push(cell)

clickSound()

}

function finishSelect(){

if(!selecting)return

selecting=false

let word=path.map(c=>c.textContent).join("")

if(words.includes(word)&&!foundWords.includes(word)){

foundWords.push(word)

let colorIndex=wordColors[word]
wordIndex++

let wordEl=document.getElementById("w_"+word)
wordEl.style.opacity="0.5"
wordEl.style.textDecoration="line-through"

for(let c of path){
c.classList.remove("active")
c.classList.add("found-"+colorIndex)
}

successSound()
speakWord(word)

if(foundWords.length===words.length)endGame()

}else{

for(let c of path)c.classList.remove("active")

}

}

function endGame(){

clearInterval(timerInterval)

endSound()

let score

let calc=timer-words.length*10

if(calc<=0)score=100
else score=Math.max(0,100-Math.floor(calc/10)*10)

document.getElementById("finalTime").textContent=timer
document.getElementById("finalScore").textContent=score

saveHistory(timer,score,words.length)

let starsContainer=document.getElementById("starsContainer")
starsContainer.innerHTML=""

let starCount
if(score>=90)starCount=3
else if(score>=60)starCount=2
else starCount=1

for(let i=0;i<3;i++){
let star=document.createElement("span")
star.className="star"+(i<starCount?" filled":"")
star.textContent=i<starCount?"⭐":"☆"
starsContainer.appendChild(star)
}

createConfetti()

document.getElementById("resultOverlay").style.display="flex"

}

function restart(){

document.getElementById("resultOverlay").style.display="none"

createEmptyGrid()

}

function saveHistory(t,s,wc){

let list=JSON.parse(localStorage.getItem("history")||"[]")

list.unshift({
time:t,
score:s,
wordCount:wc,
date:new Date().toLocaleString()
})

localStorage.setItem("history",JSON.stringify(list))

}

function showHistory(){

document.getElementById("gamePage").style.display="none"
document.getElementById("historyPage").style.display="block"

let list=JSON.parse(localStorage.getItem("history")||"[]")

let box=document.getElementById("historyList")

box.innerHTML=""

if(list.length===0){

box.innerHTML=`
<div style="text-align:center;color:#999;padding:50px 0;">
<div style="font-size:48px;margin-bottom:10px;">📭</div>
<p>暂无历史记录</p>
</div>
`
return
}

list.forEach((h,i)=>{

let d=document.createElement("div")
d.className="history-item"

let starCount
if(h.score>=90)starCount=3
else if(h.score>=60)starCount=2
else if(h.score>=30)starCount=1
else starCount=0

let stars="⭐".repeat(starCount)

d.innerHTML=`
<div class="history-info">
<div class="history-date">${h.date}</div>
<div class="history-stats">
⏱️ ${h.time}秒 <span>|</span> 🏆 ${h.score}分 <span>|</span> 📝 ${h.wordCount||5}词 <span>|</span> ${stars}
</div>
</div>
<button onclick="deleteHistory(${i})">删除</button>
`

box.appendChild(d)

})

}

function deleteHistory(i){

let list=JSON.parse(localStorage.getItem("history")||"[]")
list.splice(i,1)
localStorage.setItem("history",JSON.stringify(list))
showHistory()

}

function clearHistory(){

localStorage.removeItem("history")
showHistory()

}

function backToGame(){

document.getElementById("historyPage").style.display="none"
document.getElementById("gamePage").style.display="block"

}

document.getElementById("historyBtn").onclick=showHistory


function saveWords(){

let text=document.getElementById("wordInput").value

let arr=text.split(/[,\s]+/)
.map(w=>w.trim().toLowerCase())
.filter(Boolean)

localStorage.setItem("words",JSON.stringify(arr))

document.getElementById("settingsOverlay").style.display="none"

}

document.getElementById("settingsBtn").onclick=()=>{

document.getElementById("settingsOverlay").style.display="flex"

document.getElementById("wordInput").value=
(JSON.parse(localStorage.getItem("words")||[])).join(", ")

}


function firstInit(){

if(!localStorage.getItem("words")){

document.getElementById("settingsOverlay").style.display="flex"

}

}

firstInit()

startMusic()

if(window.speechSynthesis){
window.speechSynthesis.getVoices()
}

function createConfetti(){

let colors=["#ff6b6b","#4ecdc4","#ffe66d","#95e1d3","#dda0dd","#f9ca24","#6ab04c","#eb4d4b","#be2edd","#f0932b"]

for(let i=0;i<50;i++){

let confetti=document.createElement("div")
confetti.className="confetti"
confetti.style.left=Math.random()*100+"vw"
confetti.style.background=colors[Math.floor(Math.random()*colors.length)]
confetti.style.animation=`confettiFall ${2+Math.random()*2}s linear forwards`
confetti.style.animationDelay=Math.random()*1+"s"

document.body.appendChild(confetti)

setTimeout(()=>{
confetti.remove()
},4000)

}

}

function speakWord(word){

if(!soundOn){
console.log("Sound is off, not speaking:",word)
return
}

if(!window.speechSynthesis){
console.warn("Speech synthesis not supported")
return
}

window.speechSynthesis.cancel()

let utterance=new SpeechSynthesisUtterance(word)
utterance.lang="en-US"
utterance.rate=0.8
utterance.volume=1
utterance.pitch=1

window.speechSynthesis.speak(utterance)

}

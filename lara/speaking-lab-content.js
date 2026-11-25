/* Original, unpublished practice prompts. NOT national exam material. */
(function(root,factory){const a=factory();if(typeof module==='object'&&module.exports)module.exports=a;root.MO_SPEAKING_DATA=a;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const categories=[
{id:'life',sv:'Vardag och relationer',en:'Everyday life'},
{id:'society',sv:'Samhälle och rättvisa',en:'Society'},
{id:'money',sv:'Pengar och framtid',en:'Money and future'},
{id:'tech',sv:'Teknik och medier',en:'Technology'},
{id:'planet',sv:'Miljö och världen',en:'Environment'},
{id:'culture',sv:'Kultur, fritid och val',en:'Culture and choices'}
];
const rows=[
['friends','life','Friendship','Is having a few close friends better than having many friends?','What makes someone a good friend?'],
['kindness','life','Being kind','Should people always tell the truth, even if it hurts?','When can honesty be difficult?'],
['schoolrules','life','School rules','Should students help decide school rules?','Which rule would you change, and why?'],
['homework','life','Homework','Should schools give less homework?','How could students still practise?'],
['sleep','life','Sleep','Should school start later in the morning?','Who would benefit or struggle?'],
['pressure','life','Pressure','Can a little pressure be a good thing?','Where is the line between helpful and harmful?'],
['confidence','life','Confidence','Is it better to try something new or stick to what you know?','What helps someone feel brave enough?'],
['privacyfriends','life','Personal space','Should friends tell each other everything?','When is privacy important?'],
['teamwork','life','Teamwork','Is it easier to succeed alone or in a team?','What would make teamwork fair?'],
['phones','tech','Phones','Should phones be allowed during school breaks?','How could people use them responsibly?'],
['ai','tech','Artificial intelligence','Should students use AI to help them study?','When does help become cheating?'],
['socialmedia','tech','Social media','Does social media help people connect or feel lonely?','How might age change the answer?'],
['gaming','tech','Video games','Can video games teach useful skills?','What is one possible disadvantage?'],
['screen','tech','Screen time','Should families make rules about screen time?','Who should decide the limits?'],
['privacy','tech','Online privacy','Is convenience worth sharing personal information?','What information should stay private?'],
['influencers','tech','Influencers','Do online influencers have a responsibility to their followers?','What makes a recommendation trustworthy?'],
['robots','tech','Robots','Would you trust a robot to make important decisions?','Which decisions need a human?'],
['moneychoice','money','Money','Can money make people happy?','What is something important that money cannot buy?'],
['saving','money','Saving','Should teenagers learn how to manage money at school?','What mistake should people avoid?'],
['rich','money','Wealth','Should very wealthy people be expected to help others more?','What would be a fair contribution?'],
['jobs','money','Future jobs','Is enjoying your job more important than earning a high salary?','What if the job is stressful?'],
['dream','money','Dreams','Would you rather have a safe plan or take a big risk to follow a dream?','How could someone reduce the risk?'],
['shopping','money','Shopping','Do people buy too many things they do not need?','What could change buying habits?'],
['work','money','Part-time jobs','Should teenagers have part-time jobs during school?','How can they protect their study time?'],
['success','money','Success','Does being successful mean the same thing for everyone?','How would you measure success?'],
['crime','society','Crime','How can a community help prevent young people from committing crimes?','What roles do families, schools and society play?'],
['punishment','society','Justice','Should the main goal of punishment be to help people change?','How can society also protect others?'],
['fair','society','Fairness','Is treating everyone exactly the same always fair?','When might people need different support?'],
['laws','society','Rules and laws','Should young people have more influence over local decisions?','How might adults and teenagers disagree?'],
['bullying','society','Bullying','What should bystanders do when they see bullying?','Why can speaking up be difficult?'],
['volunteer','society','Helping others','Should volunteering be part of school life?','Should it be required or a choice?'],
['discrimination','society','Equal opportunities','What can schools do to make everyone feel included?','What could students do themselves?'],
['news','society','News','How can you tell whether something online is reliable?','What should you do before sharing it?'],
['transport','planet','Transport','Should cities make it easier to walk and cycle than to drive?','What about people who live far away?'],
['climate','planet','Climate','Do small everyday choices really make a difference to the environment?','Who has the greatest responsibility?'],
['nature','planet','Nature','Should protecting nature sometimes be more important than building new homes?','How could people find a balance?'],
['foodwaste','planet','Food waste','How could schools reduce food waste?','What could make students care more?'],
['animals','planet','Animals','Should animals have stronger legal protection?','What would change in daily life?'],
['travel','planet','Travel','Is travelling abroad the best way to learn about the world?','What can you learn without travelling?'],
['futureplanet','planet','The future','Are you more hopeful or worried about the future?','What gives you hope?'],
['water','planet','Clean water','Who should be responsible for making sure everyone has clean water?','What could ordinary people contribute?'],
['music','culture','Music','Can music change the way people feel or behave?','When has music affected a mood?'],
['sports','culture','Sports','Are sports more about winning or improving?','How would you support someone who loses?'],
['fashion','culture','Fashion','Should people care about what others think of their clothes?','How does social pressure affect choices?'],
['books','culture','Stories','Can books or films change the way we see other people?','What makes a story convincing?'],
['food','culture','Food and culture','Why is food important to culture and family?','Can traditions change and still matter?'],
['languages','culture','Languages','Should everyone learn at least one language besides their first?','What doors could that open?'],
['celebrities','culture','Fame','Would you like to be famous?','What might people give up for fame?'],
['holidays','culture','Free time','Is having nothing planned sometimes better than being busy?','How do you know when to rest?']
];
const topics=rows.map(([id,category,title,prompt,follow])=>({id,category,title,prompt,follow}));
const followUps=[
'Can you explain why you think that?',
'Could you give a real or imagined example?',
'What might someone with a different opinion say?',
'Has your opinion changed after hearing another view?',
'What could be a fair compromise?',
'How might this affect younger people?',
'What could happen in ten years?',
'Is there an exception to your idea?',
'What would you say to someone who disagrees?',
'Which part of this issue matters most to you?'
];
const framework=[
{id:'point',label:'Position',cue:'Start with a clear opinion.',say:'I think ... / In my opinion ... / It depends on ...'},
{id:'reason',label:'Reason',cue:'Explain one important why.',say:'The main reason is ... / This matters because ...'},
{id:'example',label:'Example',cue:'Make the idea concrete.',say:'For example ... / Imagine a situation where ...'},
{id:'engage',label:'Engage',cue:'Invite someone else in.',say:'What do you think? / Do you see it differently?'}
];
const rescue=[
{id:'blank',title:'Huvudet blir blankt',intro:'Det är okej att inte vara expert. Börja från något vardagligt och ge en försiktig åsikt.',lines:[
'I have not thought much about this before, but one thing I can say is ...',
'If I look at it from a student’s point of view, ...',
'A simple situation that comes to mind is ...',
'Maybe it depends on ... What do you think?']},
{id:'bored',title:'Ämnet känns tråkigt',intro:'Byt till en vinkel du kan resonera om: unga människor, rättvisa, en vardagssituation eller framtiden.',lines:[
'At first this topic seems distant from my life, but it affects people because ...',
'One useful question is who benefits and who might struggle.',
'For example, at school or at home ...',
'Would you say the advantages are greater than the disadvantages?']},
{id:'excited',title:'Du har massor att säga',intro:'Välj EN poäng och ETT exempel. Lämna sedan över ordet. Mer prat är inte automatiskt bättre.',lines:[
'My main point is ...',
'The strongest reason is ...',
'One example that shows this is ...',
'So, to come back to the question, I think ... How about you?']},
{id:'word',title:'Du hittar inte ordet',intro:'Förklara med enklare ord i stället för att stanna eller byta till svenska.',lines:[
'I cannot remember the exact word, but it is a kind of ...',
'What I mean is ...',
'Let me put it another way ...',
'It is similar to ... but different because ...']},
{id:'disagree',title:'Du håller inte med',intro:'Visa först att du hörde den andra, sedan din egen tanke.',lines:[
'I see why you would say that.',
'I agree about ..., but I see ... differently.',
'For me, the main issue is ...',
'Could you explain what you mean by ...?']}
];
const listening=[
{id:'build',title:'Build on what someone said',line:'That connects to what you said about ...',task:'Respond to one detail from your partner, then add your own thought.'},
{id:'clarify',title:'Ask for clarification',line:'Do you mean ...? / Could you explain that a little more?',task:'Ask a question that makes your partner’s idea clearer.'},
{id:'balance',title:'Show another side',line:'That is a good point. On the other hand, ...',task:'Introduce a second perspective without attacking the person.'},
{id:'invite',title:'Invite someone in',line:'We have not heard your view yet. What do you think?',task:'Bring a quieter person into the discussion naturally.'},
{id:'repair',title:'Recover from a pause',line:'Let me think for a second. Another way to look at it is ...',task:'Continue without pretending to know facts you do not know.'}
];
const checks=[
{id:'clear',name:'I expressed a clear point',help:'My main answer was understandable.'},
{id:'reason',name:'I explained why',help:'I gave at least one reason that fits the topic.'},
{id:'example',name:'I gave a relevant example or perspective',help:'Not a long story that goes off-topic.'},
{id:'listen',name:'I listened and reacted',help:'I responded to what another speaker actually said.'},
{id:'ask',name:'I helped the conversation move forward',help:'I asked a follow-up or invited another viewpoint.'},
{id:'repair',name:'I used language to keep going',help:'I rephrased, clarified, or kept speaking when stuck.'}
];
return Object.freeze({categories,topics,followUps,framework,rescue,listening,checks,version:'speaking-lab-1.0',official:false,referenceLinks:['https://www.gu.se/nationella-prov-frammande-sprak/prov-och-bedomningsstod-i-engelska/engelska-arskurs-7-9/nationella-prov-i-engelska-for-arskurs-9','https://www.skolverket.se/undervisning/grundskolan/kursplaner-for-grundskolan/subjects/GRGRENG01']});
});

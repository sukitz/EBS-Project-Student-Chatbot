#EBS-Project
- Run file index.js. It's listening on port 3000
- Run ngrok with authtoken, it's can run forever 
- Copy Forwarding https url from ngrok, and paste it to line webhook on line provider list -> "checkthestudentname" 
- To run beacon you need to have hardware id (--hwid=0133129f68) and file simplebeacon.js from git somewhere


//DONE
check teacher enter and leave on beacon and update "TeacherArrive" on firebase

//TODO
create time on database to handle student arrive, 
	when beacon found student userId check userId on database
	and copy student name and student id


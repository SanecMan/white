/datum/mentors
	var/name = "someone's mentor datum"
	var/client/owner // the actual mentor, client type
	var/target // the mentor's ckey
	var/href_token // href token for mentor commands, uses the same token used by admins.
	var/mob/following

/datum/mentors/New(ckey)
	if(!ckey)
		QDEL_IN(src, 0)
		CRASH("Mentor datum created without a ckey")
	target = ckey(ckey)
	name = "[ckey]'s mentor datum"
	href_token = GenerateToken()
	GLOB.mentor_datums[target] = src
	//set the owner var and load commands
	owner = GLOB.directory[ckey]
	if(owner)
		owner.mentor_datum = src
		owner.add_mentor_verbs()
		if(!check_rights_for(owner, R_ADMIN, FALSE)) // don't add admins to mentor list.
			GLOB.mentors[owner] = TRUE

/datum/mentors/proc/remove_mentor()
	if(owner)
		owner.remove_mentor_verbs()
		GLOB.mentors -= owner
		owner.mentor_datum = null
		owner = null
	log_admin_private("[target] was removed from the rank of mentor.")
	GLOB.mentor_datums -= target
	qdel(src)

/datum/mentors/proc/CheckMentorHREF(href, href_list)
	var/auth = href_list["mentor_token"]
	. = auth && (auth == href_token || auth == GLOB.mentor_href_token)
	if(.)
		return
	var/msg = !auth ? "no" : "a bad"
	message_admins("[key_name_admin(usr)] clicked an href with [msg] authorization key!")
	if(CONFIG_GET(flag/debug_admin_hrefs))
		message_admins("Debug mode enabled, call not blocked. Please ask your coders to review this round's logs.")
		log_world("UAH: [href]")
		return TRUE
	log_admin_private("[key_name(usr)] clicked an href with [msg] authorization key! [href]")

/proc/RawMentorHrefToken(forceGlobal = FALSE)
	var/tok = GLOB.mentor_href_token
	if(!forceGlobal && usr)
		var/client/C = usr.client
		to_chat(world, C)
		to_chat(world, usr)
		if(!C)
			CRASH("No client for HrefToken()!")
		var/datum/mentors/holder = C.mentor_datum
		if(holder)
			tok = holder.href_token
	return tok

/proc/MentorHrefToken(forceGlobal = FALSE)
	return "mentor_token=[RawMentorHrefToken(forceGlobal)]"

/proc/load_mentors()
	usr = null
	GLOB.mentor_datums.Cut()
	for(var/it as anything in GLOB.mentors)
		var/client/C = it
		C.remove_mentor_verbs()
		C.mentor_datum = null
	GLOB.mentors.Cut()
	var/list/lines = world.file2list("cfg/mentors.txt")
	for(var/line in lines)
		if(!length(line))
			continue
		if(findtextEx(line, "#", 1, 2))
			continue
		new /datum/mentors(line)

//ass blast goonstation

/obj/item/mechcomp
	name = "base MechComp component"
	desc = "Holds the basic functionality for the MechComp components. Does nothing, and you should not be seeing this."
	icon = 'white/RedFoxIV/icons/obj/mechcomp.dmi'


	var/datum/component/mechanics_holder/compdatum

	/**
	 * A crutch to use the goon mechcomp sprites, because goon iconstate
	 * format for mechcomp is [compname] for unanchored and u[compname] for anchored components.
	 *
	 * Avoid editing it in runtime as it should (?) hold the "initial" value at all times. Use update_icon_state instead,
	 * it also handles all the logic regarding anchored/unanchored sprites.
	 **/
	var/part_icon_state = "generic"

	/**
	 * Icon state for when the component is active. If you do not have a sprite for this, keep it null.
	 **/
	var/active_icon_state = null

	/**
	 * if the component has a smaller sprite for when it's anchored to the floor.
	 **/
	var/has_anchored_icon_state = FALSE


	/**
	 * If the current component is active, i.e. performing some work.
	 **/
	var/active = FALSE

	///cringe
	var/deactivatecb = CALLBACK()

	/**
	 * If only a single instance of a component is allowed to be anchored onto a tile.part_icon_state =
	 * Also resets it's own pixel_x and pixel_y vars when anchored so that it stays centered.part_icon_state =
	 **/
	var/only_one_per_tile = FALSE

	/**
	 * DO NOT FUCKING TOUCH THIS REEEE! use update_icon_state("compname") instead.
	 * Yes, even if you want your component to chance icon when it's active.
	 **/
	icon_state = "generic"


/**
 * Another part to the gooncode crutch adaptation.
 * Use it to actually change icon_state, instead of accessing icon_state or part_icon_state directly.
 **/
/obj/item/mechcomp/update_icon_state(var/part_icon_state)
	. = ..()
	icon_state = "[src.anchored && src.has_anchored_icon_state ? "u" : ""][part_icon_state]"


/obj/item/mechcomp/Initialize()
	. = ..()
	update_icon_state(part_icon_state)

/obj/item/mechcomp/ComponentInitialize()
	. = ..()
	compdatum = AddComponent(/datum/component/mechanics_holder)


/**
 * Called when a user clicks the component with an empty hand.
 * Moved to a separate proc for easier handling of active/inactive states.
 **/
/obj/item/mechcomp/proc/interact_by_hand(mob/user)
	return


/**
 * Called when a user clicks the component with an item while not on harm intent.
 * Moved to a separate proc for easier handling of active/inactive states.
 **/
/obj/item/mechcomp/proc/interact_by_item(obj/item/I, mob/user)
	return


/**
 * please no touch, use interact_by_hand instead!
 **/
/obj/item/mechcomp/attack_hand(mob/user)
	. = ..()
	if(anchored)
		interact_by_hand(user)

/**
 * please no touch, use interact_by_item instead!
 **/
/obj/item/mechcomp/attackby(obj/item/I, mob/living/user, params)
	//can't attack an /obj/item/ anyway, so might as well use harm intent for this stuff.
	if(user.a_intent == INTENT_HARM)
		. = ..() //also calls the COMSIG_PARENT_ATTACKBY, so the component handles the multitool stuff by itself.
		//i want to fucking die btw
		//this should probably be moved to another proc.
		if(I.tool_behaviour == TOOL_WRENCH)

			var/a
			if(anchored)
				a = unanchor(user)
			else
				a = anchor(user)
			if(a)
				set_anchored(!anchored)
				I.play_tool_sound(src, 100)
				user.visible_message("<span class='notice'>[user] [anchored ? "прикручивает" : "откручивает"] [src.name].</span>", \
					"<span class='notice'>Я [anchored ? "прикручиваю [src.name] к полу" : "откручиваю [src.name] от пола"].</span>")
				update_icon_state(part_icon_state)
		return

	//shouldn't get to this point if the user's intent is harm
	//this way stuff like item scanners can accept all items (like a fucking wrench) on the first 3 intents
	//AND still be wrenched (bypassing the scan) if on harm intent.
	if(anchored)
		interact_by_item(I, user)


///Returns true if anchoring is allowed, returns false if not.
/obj/item/mechcomp/proc/anchor(mob/living/user)
	if(only_one_per_tile)
		for(var/obj/item/mechcomp/i in get_turf(src))
			if(istype(i, src) && i.anchored)
				to_chat(user, "<span class='alert'>Cannot wrench two [src.name]s in one place! Pick a different spot for this one!</span>")
				return FALSE
		src.pixel_x = 0
		src.pixel_y = 0
	return TRUE

///Returns true if unanchoring is allowed, returns false if not.
/obj/item/mechcomp/proc/unanchor(mob/living/user)
	to_chat(user,"incoming - [length(compdatum.connected_incoming)] // outgoing - [length(compdatum.connected_outgoing)]")
	to_chat(user,"[length(compdatum.connected_incoming)] [length(compdatum.connected_outgoing)]")
	if (length(compdatum.connected_incoming) || length(compdatum.connected_outgoing))
		to_chat(user, "<span class='alert'>The locking bolts of [src.name] are locked in and do not budge! Disconnect all first!</span>")
		return FALSE
	//just in case we /somehow/ fucked up with the check
	SEND_SIGNAL(src, COMSIG_MECHCOMP_RM_ALL_CONNECTIONS)
	return TRUE


//feels like a good idea to include these
/obj/item/mechcomp/Destroy()
	SEND_SIGNAL(src, COMSIG_MECHCOMP_RM_ALL_CONNECTIONS)
	. = ..()



/**
 * Change the active var to TRUE and current icon to active_icon_state, it it's not null.area
 * If you want your mechcomp component to have a mandatory cooldown between activations, use a
 * if(active)
 *		return
 * construction in the beginning of your interact proc or signal handling proc.
 **/
/obj/item/mechcomp/proc/activate_for(var/time)
	active = TRUE
	if(active_icon_state)
		update_icon_state(active_icon_state)
	addtimer(CALLBACK(src, .proc/_deactivate), time)

///internal, for callback stuff.
/obj/item/mechcomp/proc/_deactivate()
	active = FALSE
	update_icon_state(part_icon_state)

/*
/obj/item/mechcomp/MouseDrop_T(atom/_drop, mob/living/user)
	. = ..()

	if(!istype(_drop,/obj/item/mechcomp))
		return

	var/obj/item/mechcomp/drop = _drop
	if(!(src.anchored && drop.anchored))
		return

	SEND_SIGNAL(src,_COMSIG_MECHCOMP_DROPCONNECT, drop, user)
*/


/**
 * here lies fancy radial menu stuff, that i wanted to use but didn't get to because signals in mechcomp don't actually have types like "strings" and "numbers".
 * R.I.P.
**/

/*
/obj/item/mechcomp/MouseDrop(atom/_over, src_location, over_location, src_control, over_control, params)
	. = ..()
	if(!istype(over, /obj/item/mechcomp))
		return
	/*
	if(!isliving(usr))
		return
	var/mob/living/user = usr
	*/
	if(user.held_items[user.active_hand_index].tool_behaviour != TOOL_MULTITOOL)
		return

	var/obj/item/mechcomp/over = _over
	for(input in input_types)
		input_icons += list(input) = image(icon = input[1], icon_state = "[input[1] ? input[1] : "unknown"]")
	var/input_choice = show_radial_menu(user, src, list/choices, tooltips = TRUE)
	to_chat(user, "<span class='notice'>Подключаю вход \"[input_choice[2]]\" [src.name]...</span>")

	for(output in over.output_types)
		input_icons += list(input[2]) = image(icon = output[1], icon_state = "[output[1] ? output[1] : "unknown"]")
	var/output_choice = show_radial_menu(user, over, list/choices, tooltips = TRUE)
	to_chat(user, "<span class='notice'>...к выходу \"[output_choice[2]]\" [over.name].</span>")
*/

// Causes any affecting light sources to be queued for a visibility update, for example a door got opened.
/turf/proc/reconsider_lights()
	var/datum/light_source/L
	var/thing
	for (thing in affecting_lights)
		L = thing
		L.vis_update()

/turf/proc/lighting_clear_overlay()
	if (lighting_object)
		qdel(lighting_object, force=TRUE)

	var/datum/lighting_corner/C
	var/thing
	for (thing in corners)
		if(!thing)
			continue
		C = thing
		C.update_active()

// Builds a lighting object for us, but only if our area is dynamic.
/turf/proc/lighting_build_overlay()
	if (lighting_object)
		qdel(lighting_object, force=TRUE) //Shitty fix for lighting objects persisting after death

	var/area/our_area = loc
	if (!IS_DYNAMIC_LIGHTING(our_area) && !light_sources)
		return

	new/datum/lighting_object(src)

	var/thing
	var/datum/lighting_corner/C
	var/datum/light_source/S
	for (thing in corners)
		if(!thing)
			continue
		C = thing
		if (!C.active) // We would activate the corner, calculate the lighting for it.
			for (thing in C.affecting)
				S = thing
				S.recalc_corner(C)
			C.active = TRUE

// Used to get a scaled lumcount.
/turf/proc/get_lumcount(minlum = 0, maxlum = 1)
	if (!lighting_object)
		return 1

	var/totallums = 0
	var/thing
	var/datum/lighting_corner/L
	for (thing in corners)
		if(!thing)
			continue
		L = thing
		totallums += L.lum_r + L.lum_b + L.lum_g
	L = lighting_corner_NW
	if (L)
		totallums += L.lum_r + L.lum_b + L.lum_g


	totallums /= 12 // 4 corners, each with 3 channels, get the average.

	totallums = (totallums - minlum) / (maxlum - minlum)

	totallums += dynamic_lumcount

	return CLAMP01(totallums)

// Returns a boolean whether the turf is on soft lighting.
// Soft lighting being the threshold at which point the overlay considers
// itself as too dark to allow sight and see_in_dark becomes useful.
// So basically if this returns true the tile is unlit black.
/turf/proc/is_softly_lit()
	if (!lighting_object)
		return FALSE

	return !(luminosity || dynamic_lumcount)


///Proc to add movable sources of opacity on the turf and let it handle lighting code.
/turf/proc/add_opacity_source(atom/movable/new_source)
	LAZYADD(opacity_sources, new_source)
	if(opacity)
		return
	recalculate_directional_opacity()


///Proc to remove movable sources of opacity on the turf and let it handle lighting code.
/turf/proc/remove_opacity_source(atom/movable/old_source)
	LAZYREMOVE(opacity_sources, old_source)
	if(opacity) //Still opaque, no need to worry on updating.
		return
	recalculate_directional_opacity()


///Calculate on which directions this turfs block view.
/turf/proc/recalculate_directional_opacity()
	. = directional_opacity
	if(opacity)
		directional_opacity = ALL_CARDINALS
		if(. != directional_opacity)
			reconsider_lights()
		return
	directional_opacity = NONE
	for(var/atom/movable/opacity_source as anything in opacity_sources)
		if(opacity_source.flags_1 & ON_BORDER_1)
			directional_opacity |= opacity_source.dir
		else //If fulltile and opaque, then the whole tile blocks view, no need to continue checking.
			directional_opacity = ALL_CARDINALS
			break
	if(. != directional_opacity && (. == ALL_CARDINALS || directional_opacity == ALL_CARDINALS))
		reconsider_lights() //The lighting system only cares whether the tile is fully concealed from all directions or not.


/turf/proc/change_area(area/old_area, area/new_area)
	if(SSlighting.initialized)
		if (new_area.dynamic_lighting != old_area.dynamic_lighting)
			if (new_area.dynamic_lighting)
				lighting_build_overlay()
			else
				lighting_clear_overlay()

/turf/proc/generate_missing_corners()
	if (!lighting_corner_NE)
		lighting_corner_NE = new/datum/lighting_corner(src, NORTH|EAST)

	if (!lighting_corner_SE)
		lighting_corner_SE = new/datum/lighting_corner(src, SOUTH|EAST)

	if (!lighting_corner_SW)
		lighting_corner_SW = new/datum/lighting_corner(src, SOUTH|WEST)

	if (!lighting_corner_NW)
		lighting_corner_NW = new/datum/lighting_corner(src, NORTH|WEST)

	lighting_corners_initialised = TRUE
	if (!corners)
		corners = list(null, null, null, null)

	for (var/i = 1 to 4)
		if (corners[i]) // Already have a corner on this direction.
			continue

		corners[i] = new/datum/lighting_corner(src, GLOB.LIGHTING_CORNER_DIAGONAL[i])

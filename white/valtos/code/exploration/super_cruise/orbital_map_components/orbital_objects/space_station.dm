/datum/orbital_object/z_linked/station
	name = "Космическая Станция 13"
	mass = 0
	radius = 60
	priority = 50
	//The station maintains its orbit around lavaland by adjustment thrusters.
	maintain_orbit = TRUE
	//Sure, why not?
	can_dock_anywhere = TRUE
	signal_range = 4000

/datum/orbital_object/z_linked/station/New()
	. = ..()
	//Set the station instance
	SSorbits.station_instance = src

	//Create the comms manager
	SSorbits.register_communication_manager(new /datum/orbital_comms_manager/station("station", "Space Station 13"))

#ifdef LOWMEMORYMODE
	var/datum/orbital_map/linked_map = SSorbits.orbital_maps[orbital_map_index]
	linked_map.center = src
#endif

/datum/orbital_object/z_linked/station/explode()
	. = ..()
	SSticker.force_ending = TRUE

/datum/orbital_object/z_linked/station/post_map_setup()
	//Orbit around the system center
	var/datum/orbital_map/linked_map = SSorbits.orbital_maps[orbital_map_index]
	set_orbitting_around_body(linked_map.center, 1800)

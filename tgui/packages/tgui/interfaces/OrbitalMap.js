// :fearful:

// Made by powerfulbacon

import { Box, Button, Section, Table, DraggableClickableControl, Dropdown, Divider, NoticeBox, ProgressBar, Flex, OrbitalMapComponent, OrbitalMapSvg, Stack, Tabs } from '../components';
import { useBackend, useLocalState } from '../backend';
import { Window } from '../layouts';

export const OrbitalMap = (props, context) => {
  const { act, data } = useBackend(context);
  const {
    map_objects = [],
    linkedToShuttle = false,
    canLaunch = false,
    recall_docking_port_id = "",
    thrust_alert = false,
    damage_alert = false,
    shuttleName = "",
    interdictionTime = 0,
    designatorInserted = false,
    designatorId = null,
    shuttleId = null,
  } = data;
  const [
    zoomScale,
    setZoomScale,
  ] = useLocalState(context, 'zoomScale', 1);
  const [
    xOffset,
    setXOffset,
  ] = useLocalState(context, 'xOffset', 0);
  const [
    yOffset,
    setYOffset,
  ] = useLocalState(context, 'yOffset', 0);
  const [
    trackedBody,
    setTrackedBody,
  ] = useLocalState(context, 'trackedBody', shuttleName);

  let dynamicXOffset = xOffset;
  let dynamicYOffset = yOffset;

  let trackedObject = null;
  let ourObject = null;
  if (map_objects.length > 0 && interdictionTime === 0)
  {
    // Find the right tracked body
    map_objects.forEach(element => {
      if (element.name === shuttleName)
      {
        ourObject = element;
      }
      if (element.name === trackedBody && !trackedObject)
      {
        trackedObject = element;
        if (trackedBody !== map_objects[0].name)
        {
          dynamicXOffset = trackedObject.position_x
           + trackedObject.velocity_x;
          dynamicYOffset = trackedObject.position_y
           + trackedObject.velocity_y;
        }
      }
    });
  }

  return (
    <Window
      width={1136}
      height={770} >
      <Window.Content fitted>
        <Flex height="100%">
          <Flex.Item class="OrbitalMap__radar" grow id="radar">
            <DisplayWindow
              xOffset={dynamicXOffset}
              yOffset={dynamicYOffset}
              isTracking={trackedBody !== "None"}
              zoomScale={zoomScale}
              setZoomScale={setZoomScale}
              setXOffset={setXOffset}
              setYOffset={setYOffset}
              setTrackedBody={setTrackedBody}
              ourObject={ourObject}
              interdictionTime={interdictionTime} />
          </Flex.Item>
          <Flex.Item class="OrbitalMap__panel">
            <Section fill scrollable>
              <Section title="Отслеживание тел">
                <Box bold>
                  Отслеживание
                </Box>
                <Box mb={1}>
                  {trackedBody}
                </Box>
                <Box>
                  <b>
                    X:&nbsp;
                  </b>
                  {trackedObject && trackedObject.position_x}
                </Box>
                <Box>
                  <b>
                    Y:&nbsp;
                  </b>
                  {trackedObject && trackedObject.position_y}
                </Box>
                <Box>
                  <b>
                    Ускорение:&nbsp;
                  </b>
                  ({trackedObject && trackedObject.velocity_x}
                  , {trackedObject && trackedObject.velocity_y})
                </Box>
                <Box>
                  <b>
                    Радиус:&nbsp;
                  </b>
                  {trackedObject && trackedObject.radius} БСЕ
                </Box>
                <Divider />
                <Dropdown
                  selected={trackedBody}
                  width="100%"
                  color="grey"
                  options={map_objects.sort((first,
                    second) => { return second.priority - first.priority; })
                    .map(map_object => (map_object.name))}
                  onSelected={value => setTrackedBody(value)} />
              </Section>
              <Divider />
              <Section title="Управление полётом">
                {(!thrust_alert) || (
                  <NoticeBox color="red">
                    {thrust_alert}
                  </NoticeBox>
                )}
                {(!damage_alert) || (
                  <NoticeBox color="red">
                    {damage_alert}
                  </NoticeBox>
                )}
                {recall_docking_port_id !== ""
                  ? <RecallControl />
                  : linkedToShuttle
                    ? <ShuttleControls />
                    : (canLaunch ? (
                      <>
                        <NoticeBox>
                          Пристыкованы, ожидаем запуск.
                        </NoticeBox>
                        <Button
                          content="ЗАПУСК"
                          textAlign="center"
                          fontSize="30px"
                          icon="rocket"
                          width="100%"
                          height="50px"
                          onClick={() => act('launch')} />
                      </>
                    ) : (
                      <NoticeBox
                        color="red">
                        Не обнаружен шаттл.
                      </NoticeBox>
                    ))}
              </Section>
              {
                !!designatorInserted
                && (designatorId ? !shuttleId : shuttleId) && (
                  <>
                    <Divider />
                    <Section title="Привязка" >
                      {
                        designatorId
                          ? (
                            <Button
                              content="Загрузить ссылку на шаттл"
                              onClick={() => act('updateLinkedId')} />
                          )
                          : (
                            <Button
                              content="Выгрузить ссылку на шаттл"
                              onClick={() => act('updateDesignatorId')} />
                          )
                      }
                    </Section>
                  </>
                )
              }
            </Section>
          </Flex.Item>
        </Flex>
      </Window.Content>
    </Window>
  );
};

export const DisplayWindow = (props, context) => {
  const { data } = useBackend(context);

  const {
    communication_targets = {},
  } = data;

  const {
    xOffset,
    yOffset,
    zoomScale,
    setZoomScale,
    setXOffset,
    setYOffset,
    interdictionTime,
    isTracking,
    setTrackedBody,
    ourObject,
  } = props;

  const [
    isInterdicted,
    setIsInterdicted,
  ] = useLocalState(context, 'isInterdicted', false);

  const [
    selectedMap,
    setSelectedMap,
  ] = useLocalState(context, 'selectedMap', 'map');

  if (isInterdicted === false && interdictionTime > 0) {
    setIsInterdicted(true);
    setSelectedMap('interdiction');
  } else if (interdictionTime <= 0 && isInterdicted === true) {
    setIsInterdicted(false);
  }

  if (selectedMap === 'communication' && Object.keys(communication_targets).length === 0) {
    setSelectedMap('map');
    return;
  }

  return (
    <>
      {selectedMap === 'interdiction' ? (
        <InterdictionDisplay
          xOffset={xOffset}
          yOffset={yOffset}
          zoomScale={zoomScale}
          setZoomScale={setZoomScale}
          setXOffset={setXOffset}
          setYOffset={setYOffset} />
      ) : selectedMap === 'communication' ? (
        <OrbitalMapComms />
      ) : (
        <OrbitalMapDisplay
          dynamicXOffset={xOffset}
          dynamicYOffset={yOffset}
          isTracking={isTracking}
          zoomScale={zoomScale}
          setZoomScale={setZoomScale}
          setTrackedBody={setTrackedBody}
          ourObject={ourObject} />
      )}
      {selectedMap !== 'communication' && (
        <>
          <Button
            position="absolute"
            icon="search-plus"
            right="20px"
            top="15px"
            fontSize="18px"
            color="grey"
            onClick={() => setZoomScale(zoomScale * 2)} />
          <Button
            position="absolute"
            icon="search-minus"
            right="20px"
            top="47px"
            fontSize="18px"
            color="grey"
            onClick={() => setZoomScale(zoomScale / 2)} />
        </>
      )}
      <Button
        position="absolute"
        icon="map"
        right="5px"
        bottom="83px"
        fontSize="18px"
        color="grey"
        onClick={() => setSelectedMap('map')}
        selected={selectedMap === 'map'}
        content="Орбитальная карта" />
      <Button
        position="absolute"
        icon="route"
        right="5px"
        bottom="49px"
        fontSize="18px"
        color="grey"
        onClick={() => setSelectedMap('interdiction')}
        selected={selectedMap === 'interdiction'}
        content="Местная карта" />
      {Object.keys(communication_targets).length > 0 && <Button
        position="absolute"
        icon="satellite-dish"
        right="5px"
        bottom="15px"
        fontSize="18px"
        color="grey"
        onClick={() => setSelectedMap('communication')}
        selected={selectedMap === 'communication'}
        content="Связь" />}
    </>
  );
};

export const OrbitalMapComms = (props, context) => {
  const { act, data } = useBackend(context);

  const {
    communication_targets = {},
    messages = [],
  } = data;

  const [
    communicationTarget,
    setCommunicationTarget,
  ] = useLocalState(context, 'communicationTarget', communication_targets[0].id);

  const message_category = messages[communicationTarget];

  return (
    <Stack
      height="100%">
      <Stack.Item
        overflowY="auto">
        <Section
          height="100%"
          title="Связь">
          <Tabs vertical>
            {communication_targets.map(element => (
              <Tabs.Tab
                key={element.id}
                selected={communicationTarget===element.id}
                onClick={() => setCommunicationTarget(element.id)}>
                {element.name}
              </Tabs.Tab>
            ))}
          </Tabs>
        </Section>
      </Stack.Item>
      <Stack.Divider />
      <Stack.Item width="100%">
        <Section width="100%" height="100%" title="Окно связи" overflowY="scroll">
          <Button
            inline
            flex={1}
            icon="comments-o"
            onClick={() => act('send_message', {
              id: communicationTarget,
            })} >
            Отправить сообщение
          </Button>
          <Button
            inline
            flex={1}
            icon="exclamation-triangle"
            onClick={() => act('send_emergency_message', {
              id: communicationTarget,
            })} >
            Отправить экстренное сообщение
          </Button>
          <Divider />
          <Table>
            {message_category && message_category.map(message =>
              message.sourced_locally ? (
                <Table.Row>
                  <Table.Cell bold color="red">
                    <b>Я</b>
                  </Table.Cell>
                  <Table.Cell width="100%">
                    {message.message}
                    <Divider />
                  </Table.Cell>
                  <Table.Cell> </Table.Cell>
                </Table.Row>
              ) : (
                <Table.Row>
                  <Table.Cell> </Table.Cell>
                  <Table.Cell width="100%">
                    {message.message}
                    <Divider />
                  </Table.Cell>
                  <Table.Cell bold color="blue">
                    {communicationTarget}
                  </Table.Cell>
                </Table.Row>
              )
            )}
          </Table>
        </Section>
      </Stack.Item>
      <Stack.Divider />
    </Stack>
  );
};

export const InterdictionDisplay = (props, context) => {

  const boxTargetStyle = {
    "fill-opacity": 0,
    stroke: '#DDDDDD',
    strokeWidth: '1',
  };

  const {
    xOffset,
    yOffset,
    zoomScale,
    setZoomScale,
    setXOffset,
    setYOffset,
  } = props;

  let lockedZoomScale = Math.max(Math.min(zoomScale, 4), 0.125);

  const { data } = useBackend(context);

  const {
    interdictionTime = 0,
    interdictedShuttles = [],
  } = data;

  return (
    <>
      <NoticeBox
        position="absolute"
        color="red">
        <Box bold mt={1} ml={1}>
          ДВИГАТЕЛИ ПЕРЕХВАЧЕНЫ
        </Box>
        <Box ml={1}>
          Управление полётом отключено. Двигатели перезапустятся через{' '}
          {interdictionTime / 10} секунд.
        </Box>
        <Box ml={1}>
          Местные шаттлы отмечены на карте.
        </Box>
      </NoticeBox>
      <Button
        position="absolute"
        icon="search-plus"
        right="20px"
        top="15px"
        fontSize="18px"
        color="grey"
        onClick={() => setZoomScale(zoomScale * 2)} />
      <Button
        position="absolute"
        icon="search-minus"
        right="20px"
        top="47px"
        fontSize="18px"
        color="grey"
        onClick={() => setZoomScale(zoomScale / 2)} />
      <DraggableClickableControl
        position="absolute"
        value={xOffset}
        dragMatrix={[-1, 0]}
        step={1}
        stepPixelSize={2 * zoomScale}
        onDrag={(e, value) => {
          setXOffset(value);
        }}
        onClick={(e, value) => {}}
        updateRate={5}>
        {control => (
          <DraggableClickableControl
            position="absolute"
            value={yOffset}
            dragMatrix={[0, -1]}
            step={1}
            stepPixelSize={2 * zoomScale}
            onDrag={(e, value) => {
              setYOffset(value);
            }}
            onClick={(e, value) => {}}
            updateRate={5}>
            {control1 => (
              <>
                {control.inputElement}
                {control1.inputElement}
                <svg
                  onMouseDown={e => {
                    control.handleDragStart(e);
                    control1.handleDragStart(e);
                  }}
                  viewBox="-250 -250 500 500"
                  position="absolute"
                  overflowY="hidden">
                  <defs>
                    <pattern id="grid" width={100 * lockedZoomScale}
                      height={100 * lockedZoomScale}
                      patternUnits="userSpaceOnUse"
                      x={-xOffset * zoomScale}
                      y={-yOffset * zoomScale}>
                      <rect width={100 * lockedZoomScale}
                        height={100 * lockedZoomScale}
                        fill="url(#smallgrid)" />
                      <path
                        fill="none" stroke="#CE1935" stroke-width="1"
                        d={"M " + (100 * lockedZoomScale)+ " 0 L 0 0 0 " + (100 * lockedZoomScale)} />
                    </pattern>
                    <pattern id="smallgrid"
                      width={50 * lockedZoomScale}
                      height={50 * lockedZoomScale}
                      patternUnits="userSpaceOnUse">
                      <rect
                        width={50 * lockedZoomScale}
                        height={50 * lockedZoomScale}
                        fill="#382424" />
                      <path
                        fill="none"
                        stroke="#CE1935"
                        stroke-width="0.5"
                        d={"M " + (50 * lockedZoomScale) + " 0 L 0 0 0 "
                        + (50 * lockedZoomScale)} />
                    </pattern>
                  </defs>
                  <rect x="-50%" y="-50%" width="100%" height="100%"
                    fill="url(#grid)" />
                  {interdictedShuttles.map(map_object => (
                    <>
                      <rect
                        x={(map_object.x * 10 - 25 - xOffset) * zoomScale}
                        y={(-map_object.y * 10 - 25 - yOffset) * zoomScale}
                        width={50 * zoomScale}
                        height={50 * zoomScale}
                        style={boxTargetStyle} />
                      <text
                        x={Math.max(Math.min((map_object.x * 10
                          - xOffset
                          + 30)
                          * zoomScale, 200), -250)}
                        y={Math.max(Math.min((-map_object.y * 10
                          - yOffset
                          - 30)
                          * zoomScale, 250), -240)}
                        fill="white"
                        fontSize={Math.min(40 * lockedZoomScale, 14)}>
                        {map_object.shuttleName} ({map_object.x},{map_object.y})
                      </text>
                    </>
                  ))}
                </svg>
              </>
            )}
          </DraggableClickableControl>
        )}
      </DraggableClickableControl>
    </>
  );

};

export const OrbitalMapDisplay = (props, context) => {

  const {
    zoomScale,
    setZoomScale,
    setTrackedBody,
    ourObject,
    isTracking = false,
    dynamicXOffset,
    dynamicYOffset,
  } = props;

  const [
    offset,
    setOffset,
  ] = useLocalState(context, 'offset', [0, 0]);

  let lockedZoomScale = Math.max(Math.min(zoomScale, 4), 0.125);

  const { act, data } = useBackend(context);

  const {
    map_objects = [],
    shuttleName = "",
    validDockingPorts = [],
    isDocking = false,
    interdiction_range = 150,
    detection_range = 0,
    shuttleTargetX = 0,
    shuttleTargetY = 0,
    update_index = 0,
  } = data;

  return (
    <>
      <Button
        position="absolute"
        icon="search-plus"
        right="20px"
        top="15px"
        fontSize="18px"
        color="grey"
        onClick={() => setZoomScale(zoomScale * 2)} />
      <Button
        position="absolute"
        icon="search-minus"
        right="20px"
        top="47px"
        fontSize="18px"
        color="grey"
        onClick={() => setZoomScale(zoomScale / 2)} />
      {!isDocking || (
        <NoticeBox
          position="absolute"
          color="red"
          top="50px"
          left="calc(50% - 150px)"
          width="300px"
          textAlign="center"
          fontSize="14px">
          <>
            <NoticeBox mt={1}>
              СТЫКОВОЧНЫЙ ПРОТОКОЛ АКТИВЕН, ПОЛЁТ ОСТАНОВЛЕН - ВЫБЕРИТЕ МЕСТО
              СТЫКОВКИ.
            </NoticeBox>
            <Dropdown
              mt={1}
              selected="Выбрать место стыковки"
              width="100%"
              options={validDockingPorts.map(
                map_object => (
                  <option key={map_object.id}>
                    {map_object.name}
                  </option>
                ))}
              onSelected={value => act("gotoPort", {
                port: value.key,
              })} />
          </>
        </NoticeBox>
      )}
      <OrbitalMapComponent
        position="absolute"
        step={1}
        stepPixelSize={2 * zoomScale}
        onDrag={(e, valueX, valueY) => {
          setOffset([valueX, valueY]);
          setTrackedBody("None");
        }}
        valueX={isTracking ? dynamicXOffset : offset[0]}
        valueY={isTracking ? dynamicYOffset : offset[1]}
        isTracking={isTracking}
        dynamicXOffset={dynamicXOffset}
        dynamicYOffset={dynamicYOffset}
        currentUpdateIndex={update_index}
        onClick={(e, xOffset, yOffset) => {
          let clickedOnDiv = document.getElementById("radar"); // This is kind
          // of funky but A) I don't know react / javascript and B) Nobody in
          // the history of the universe knows react / javascript so nobody
          // will probably ever read this so I'm good.
          let proportionalX = e.offsetX / clickedOnDiv.offsetWidth * 500;
          let proportionalY = (e.offsetY - 30) / clickedOnDiv.offsetHeight
           * 500;
          act("setTargetCoords", {
            x: (proportionalX - 250) / zoomScale + (isTracking
              ? dynamicXOffset : xOffset),
            y: (proportionalY - 250) / zoomScale + (isTracking
              ? dynamicYOffset : yOffset),
          });
        }} >
        {control => (
          <OrbitalMapSvg
            scaledXOffset={-control.xOffset * zoomScale}
            scaledYOffset={-control.yOffset * zoomScale}
            xOffset={-control.xOffset}
            yOffset={-control.yOffset}
            ourObject={ourObject}
            lockedZoomScale={lockedZoomScale}
            map_objects={map_objects}
            interdiction_range={interdiction_range}
            detection_range={detection_range}
            shuttleTargetX={shuttleTargetX}
            shuttleTargetY={shuttleTargetY}
            dragStartEvent={e => control.handleDragStart(e)}
            zoomScale={zoomScale}
            shuttleName={shuttleName}
            currentUpdateIndex={update_index}>
            {control => (
              control.svgComponent
            )}
          </OrbitalMapSvg>
        )}
      </OrbitalMapComponent>
    </>
  );

};

export const RecallControl = (props, context) => {
  const { act, data } = useBackend(context);
  const { request_shuttle_message } = data;
  return (
    <>
      <NoticeBox>
        Ручное управление отключено, данная локация может только призывать
        шаттл.
      </NoticeBox>
      <Button
        content={request_shuttle_message}
        textAlign="center"
        fontSize="30px"
        icon="rocket"
        width="100%"
        height="50px"
        onClick={() => act('callShuttle')} />
    </>
  );
};

export const ShuttleControls = (props, context) => {
  const { act, data } = useBackend(context);
  const {
    map_objects = [],
    shuttleTarget = null,
    shuttleAngle = 0,
    shuttleThrust = 0,
    canDock = false,
    isDocking = false,
    display_fuel = false,
    fuel = 0,
    display_stats = [],
    autopilot_enabled = false,
    breaking = false,
  } = data;
  // Sort the map objects by priority
  let sortedMapObjects = map_objects.sort((first,
    second) => { return second.priority - first.priority; });
  return (
    <>
      <Box bold>
        Автопилот к цели
      </Box>
      <Dropdown
        mt={1}
        selected={shuttleTarget}
        width="100%"
        options={sortedMapObjects.map(map_object => (map_object.name))}
        onSelected={value => act("setTarget", {
          target: value,
        })} />
      <Box mt={1}>
        Ускорение будет синхронизированно с ускорением объекта.
      </Box>
      <ShuttleMap />
      <NoticeBox color="purple" mt={2}>
        Нажми на основной дисплей чтобы лететь.
      </NoticeBox>
      <Button
        mt={2}
        width="100%"
        content={autopilot_enabled ? "Отключить автопилот" : "Включить автопилот"}
        icon="microchip"
        onClick={() => act('nautopilot')}
        color={autopilot_enabled ? "green" : "red"} />
      <Button
        width="100%"
        content={breaking ? "Отключить экстренный тормоз" : "Включить экстренный тормоз"}
        icon="anchor"
        onClick={() => act('toggleBreaking', {
          enabled: breaking ? "false" : "true",
        })}
        color={breaking ? "green" : "red"} />
      {!(canDock && !isDocking) || (
        <Button
          width="100%"
          content="Начать стыковку"
          color="orange"
          icon="rocket"
          onClick={() => act('dock')} />
      )}
      <Button
        width="100%"
        content="ЗАПУСТИТЬ ПЕРЕХВАТ"
        icon="hand-paper"
        onClick={() => act('interdict')}
        color="purple" />
      <Box bold>
        Ускорение
      </Box>
      <Box>
        Ускорение шаттла: {shuttleThrust}
      </Box>
      <Box bold mt={2}>
        Угол ускорения
      </Box>
      <Box>
        Угол: {shuttleAngle}
      </Box>
      {(!display_fuel) || (
        <>
          <Box bold mt={2}>
            Топлива осталось
          </Box>
          <ProgressBar
            value={fuel}>
            {fuel} моль.
          </ProgressBar>
        </>
      )}
      <Table mt={2}>
        {Object.keys(display_stats).map(value => (
          <Table.Row key={value}>
            <Table.Cell bold>
              {value} :
            </Table.Cell>
            <Table.Cell textAlign="right">
              {display_stats[value]}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table>
    </>
  );
};

export const ShuttleMap = (props, context) => {
  const lineStyle = {
    stroke: '#BBBBBB',
    strokeWidth: '2',
  };
  const velLineStyle = {
    stroke: '#00FF00',
    strokeWidth: '2',
  };
  const { act, data } = useBackend(context);
  const {
    shuttleAngle = 0,
    shuttleThrust = 0,
    shuttleVelX = 0,
    shuttleVelY = 0,
  } = data;
  let x = (shuttleThrust + 30) * Math.cos(shuttleAngle * (2 * Math.PI / 360));
  let y = (shuttleThrust + 30) * Math.sin(shuttleAngle * (2 * Math.PI / 360));
  return (
    <Box
      width="370px"
      height="160px">
      <svg
        position="absolute"
        height="100%"
        viewBox="-100 -100 200 200">
        <defs>
          <pattern id="grid" width={200} height={200} patternUnits="userSpaceOnUse">
            <rect width={200} height={200} fill="url(#smallgrid)" />
            <path d={"M 200 0 L 0 0 0 200"} fill="none" stroke="#4665DE" stroke-width="1" />
          </pattern>
          <pattern id="smallgrid" width={100} height={100} patternUnits="userSpaceOnUse">
            <rect width={100} height={100} fill="#2B2E3B" />
            <path d={"M 100 0 L 0 0 0 100"} fill="none" stroke="#4665DE" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect x="-50%" y="-50%" width="100%" height="100%" fill="url(#grid)" />
        <circle
          r="30px"
          stroke="#BBBBBB"
          stroke-width="1"
          fill="rgba(0,0,0,0)" />
        <line
          x1={0}
          y1={0}
          x2={x}
          y2={y}
          style={lineStyle} />
        <line
          x1={0}
          y1={0}
          x2={shuttleVelX}
          y2={shuttleVelY}
          style={velLineStyle} />
      </svg>
    </Box>
  );
};

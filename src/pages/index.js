import React from 'react';
import 'typeface-roboto';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import withRoot from '../withRoot';
import ButtonAppBar from '../ButtonAppBar';
import Graph from '../Graph';
import TextEditor from '../TextEditor';
import MainMenu from '../MainMenu';
import HelpMenu from '../HelpMenu';
import SettingsDialog from '../SettingsDialog';
import OpenFromBrowserDialog from '../OpenFromBrowserDialog';
import SaveToBrowserAsDialog from '../SaveToBrowserAsDialog';
import DoYouWantToReplaceItDialog from '../DoYouWantToReplaceItDialog';
import InsertPanels from '../InsertPanels';
import FormatDrawer from '../FormatDrawer';
import { schemeCategory10 as d3_schemeCategory10} from 'd3-scale-chromatic';
import { schemePaired as d3_schemePaired} from 'd3-scale-chromatic';
import KeyboardShortcutsDialog from '../KeyboardShortcutsDialog';
import MouseOperationsDialog from '../MouseOperationsDialog';
import AboutDialog from '../AboutDialog';

const styles = theme => ({
  root: {
    textAlign: 'center',
  },
  paper: {
    // viewport height - app bar - 2 * padding
    height: "calc(100vh - 64px - 2 * 12px)",
  }
});

const defaultElevation = 2;
const focusedElevation = 8;

class Index extends React.Component {

  constructor(props) {
    super(props);
    let dotSrc = localStorage.getItem('dotSrc');
    if (dotSrc == null) {
      dotSrc = `strict digraph {
    a [shape="ellipse" style="filled" fillcolor="` + d3_schemeCategory10[0] + `"]
    b [shape="polygon" style="filled" fillcolor="` + d3_schemeCategory10[1] + `"]
    a -> b [fillcolor="` + d3_schemePaired[0] + `" color="` + d3_schemePaired[1] + `"]
}`;
    }
    this.state = {
      projects: JSON.parse(localStorage.getItem('projects')) || {},
      initialized: false,
      name: localStorage.getItem('name') || 'Untitled',
      dotSrc: dotSrc,
      dotSrcLastChangeTime: +localStorage.getItem('dotSrcLastChangeTime') || Date.now(),
      mainMenuIsOpen: false,
      helpMenuIsOpen: false,
      settingsDialogIsOpen: false,
      openFromBrowserDialogIsOpen: false,
      saveToBrowserAsDialogIsOpen: false,
      doYouWantToReplaceItDialogIsOpen: false,
      replaceName: '',
      insertPanelsAreOpen: (localStorage.getItem('insertPanelsAreOpen') || 'false') === 'true',
      nodeFormatDrawerIsOpen: (localStorage.getItem('nodeFormatDrawerIsOpen') || 'false') === 'true',
      edgeFormatDrawerIsOpen: (localStorage.getItem('edgeFormatDrawerIsOpen') || 'false') === 'true',
      keyboardShortcutsDialogIsOpen: false,
      mouseOperationsDialogIsOpen: false,
      aboutDialogIsOpen: false,
      fitGraph : localStorage.getItem('fitGraph') === 'true',
      transitionDuration: localStorage.getItem('transitionDuration') || 1,
      tweenPaths : localStorage.getItem('tweenPaths') !== 'false',
      tweenShapes : localStorage.getItem('tweenShapes') !== 'false',
      tweenPrecision : localStorage.getItem('tweenPrecision') || '1%',
      engine : localStorage.getItem('engine') || 'dot',
      defaultNodeAttributes: JSON.parse(localStorage.getItem('defaultNodeAttributes')) || {},
      defaultEdgeAttributes: JSON.parse(localStorage.getItem('defaultEdgeAttributes')) || {},
      error: null,
      holdOff: localStorage.getItem('holdOff') || 0.2,
      fontSize: localStorage.getItem('fontSize') || 12,
      tabSize: +localStorage.getItem('tabSize') || 4,
      selectedGraphComponents: [],
    };
  }

  componentDidMount() {
    document.onblur = () => {
      // Needed when the user clicks outside the document,
      // e.g. the browser address bar
      this.setFocus(null);
    }
  }

  setPersistentState = (updater) => {
    this.setState((state) => {
      if (typeof updater === 'function') {
        var obj = updater(state);
      } else {
        obj = updater;
      }
      if (obj != null) {
        Object.keys(obj).forEach((key) => {
          let value = obj[key];
          if (typeof value === 'boolean') {
            value = value.toString();
          }
          else if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          localStorage.setItem(key, value);
        });
      }
      return obj;
    });
  }

  handleTextChange = (text) => {
    this.setPersistentState({
      dotSrc: text,
      dotSrcLastChangeTime: Date.now(),
    });
  }

  handleMainMenuButtonClick = (anchorEl) => {
    this.setState({
      mainMenuIsOpen: true,
      mainMenuAnchorEl: anchorEl,
    });
  }

  handleUndoButtonClick = () => {
    this.undo();
  }

  handleRedoButtonClick = () => {
    this.redo();
  }

  handleMainMenuClose = () => {
    this.setState({
      mainMenuIsOpen: false,
    });
  }

  handleHelpButtonClick = (anchorEl) => {
    this.setState({
      helpMenuIsOpen: true,
      helpMenuAnchorEl: anchorEl,
    });
  }

  handleHelpMenuClose = () => {
    this.setState({
      helpMenuIsOpen: false,
    });
  }

  handleInsertButtonClick = () => {
    this.setFocusIf('insertPanelsAreOpen', null, 'InsertPanels')
    this.setPersistentState({
      insertPanelsAreOpen: !this.state.insertPanelsAreOpen,
    });
  }

  handleNodeFormatButtonClick = () => {
    this.setFocusIf('nodeFormatDrawerIsOpen', null, 'NodeFormatDrawer')
    this.setPersistentState({
      nodeFormatDrawerIsOpen: !this.state.nodeFormatDrawerIsOpen,
      edgeFormatDrawerIsOpen: false,
    });
  }

  handleNodeFormatDrawerClose = () => {
    this.setPersistentState({
      nodeFormatDrawerIsOpen: false,
    });
    this.setFocus(null);
  }

  handleEdgeFormatButtonClick = () => {
    this.setFocusIf('edgeFormatDrawerIsOpen', null, 'EdgeFormatDrawer')
    this.setPersistentState({
      edgeFormatDrawerIsOpen: !this.state.edgeFormatDrawerIsOpen,
      nodeFormatDrawerIsOpen: false,
    });
  }

  handleEdgeFormatDrawerClose = () => {
    this.setPersistentState({
      edgeFormatDrawerIsOpen: false,
    });
    this.setFocus(null);
  }

  handleSettingsClick = () => {
    this.setState({
      settingsDialogIsOpen: true,
    });
  }

  handleSettingsClose = () => {
    this.setState({
      settingsDialogIsOpen: false,
    });
  }

  handleOpenFromBrowserClick = () => {
    this.setState({
      openFromBrowserDialogIsOpen: true,
    });
  }

  handleOpenFromBrowserClose = () => {
    this.setState({
      openFromBrowserDialogIsOpen: false,
    });
  }

  handleOpenFromBrowser = (newCurrentName) => {
    const currentName = this.state.name;
    if (newCurrentName !== currentName) {
      this.setPersistentState(state => {
        const projects = {...state.projects};
        const currentProject = {
          dotSrc: state.dotSrc,
          dotSrcLastChangeTime: state.dotSrcLastChangeTime,
        };
        projects[currentName] = currentProject;
        const newCurrentProject = projects[newCurrentName];
        delete projects[newCurrentName];
        return {
          name: newCurrentName,
          ...newCurrentProject,
          projects: projects,
        }
      });
    }
    this.handleOpenFromBrowserClose();
  }

  handleSaveToBrowserAsClick = () => {
    this.setState({
      saveToBrowserAsDialogIsOpen: true,
    });
  }

  handleSaveToBrowserAsClose = () => {
    this.setState({
      saveToBrowserAsDialogIsOpen: false,
    });
  }

  handleSaveToBrowserAs = (newName, askForConfirmationIfExist=true) => {
    const currentName = this.state.name;
    if (newName !== currentName) {
      if (this.state.projects[newName] == null || !askForConfirmationIfExist) {
        const currentProject = {
          dotSrc: this.state.dotSrc,
          dotSrcLastChangeTime: state.dotSrcLastChangeTime,
        };
        this.setPersistentState(state => ({
          projects: {
            ...state.projects,
            [currentName]: currentProject,
          },
          name: newName,
        }));
        this.setState({
          doYouWantToReplaceItDialogIsOpen: false,
        });
      } else {
        this.setState({
          doYouWantToReplaceItDialogIsOpen: true,
          replaceName: newName,
        });
      }
    }
    this.handleSaveToBrowserAsClose();
  }

  handleDoYouWantToReplaceItClose = () => {
    this.setState({
      doYouWantToReplaceItDialogIsOpen: false,
    });
  }

  handleEngineSelectChange = (engine) => {
    this.setPersistentState({
      engine: engine,
    });
  }

  handleFitGraphSwitchChange = (fitGraph) => {
    this.setPersistentState({
      fitGraph: fitGraph,
    });
  }

  handleTransitionDurationChange = (transitionDuration) => {
    this.setPersistentState({
      transitionDuration: transitionDuration,
    });
  }

  handleTweenPathsSwitchChange = (tweenPaths) => {
    this.setPersistentState({
      tweenPaths: tweenPaths,
    });
  }

  handleTweenShapesSwitchChange = (tweenShapes) => {
    this.setPersistentState({
      tweenShapes: tweenShapes,
    });
  }

  handleTweenPrecisionChange = (tweenPrecision) => {
    this.setPersistentState({
      tweenPrecision: tweenPrecision,
    });
  }

  handleHoldOffChange = (holdOff) => {
    this.setPersistentState({
      holdOff: holdOff,
    });
  }

  handleFontSizeChange = (fontSize) => {
    this.setPersistentState({
      fontSize: fontSize,
    });
  }

  handleTabSizeChange = (tabSize) => {
    this.setPersistentState({
      tabSize: tabSize,
    });
  }

  handleNodeShapeClick = (shape) => {
    let x0 = null;
    let y0 = null;
    this.insertNode(x0, y0, {shape: shape});
  }

  handleNodeStyleChange = (style) => {
    this.setPersistentState(state => ({
      defaultNodeAttributes: {
          ...state.defaultNodeAttributes,
        style: style,
      },
    }));
  }

  handleNodeColorChange = (color) => {
    this.setPersistentState(state => ({
      defaultNodeAttributes: {
          ...state.defaultNodeAttributes,
        color: color,
      },
    }));
  }

  handleNodeFillColorChange = (color) => {
    this.setPersistentState(state => ({
      defaultNodeAttributes: {
          ...state.defaultNodeAttributes,
        fillcolor: color,
      },
    }));
  }

  handleEdgeStyleChange = (style) => {
    this.setPersistentState(state => ({
      defaultEdgeAttributes: {
          ...state.defaultEdgeAttributes,
        style: style,
      },
    }));
  }

  handleEdgeColorChange = (color) => {
    this.setPersistentState(state => ({
      defaultEdgeAttributes: {
          ...state.defaultEdgeAttributes,
        color: color,
      },
    }));
  }

  handleEdgeFillColorChange = (color) => {
    this.setPersistentState(state => ({
      defaultEdgeAttributes: {
          ...state.defaultEdgeAttributes,
        fillcolor: color,
      },
    }));
  }

  handleKeyboardShortcutsClick = () => {
    this.setState({
      keyboardShortcutsDialogIsOpen: true,
    });
  }

  handleKeyboardShortcutsDialogClose = () => {
    this.setState({
      keyboardShortcutsDialogIsOpen: false,
    });
  }

  handleMouseOperationsClick = () => {
    this.setState({
      mouseOperationsDialogIsOpen: true,
    });
  }

  handleMouseOperationsDialogClose = () => {
    this.setState({
      mouseOperationsDialogIsOpen: false,
    });
  }

  handleAboutClick = () => {
    this.setState({
      aboutDialogIsOpen: true,
    });
  }

  handleAboutDialogClose = () => {
    this.setState({
      aboutDialogIsOpen: false,
    });
  }

  registerNodeShapeClick = (handleNodeShapeClick) => {
    this.handleNodeShapeClick = handleNodeShapeClick;
  }

  registerNodeShapeDragStart = (handleNodeShapeDragStart) => {
    this.handleNodeShapeDragStart = handleNodeShapeDragStart;
  }

  registerNodeShapeDragEnd = (handleNodeShapeDragEnd) => {
    this.handleNodeShapeDragEnd = handleNodeShapeDragEnd;
  }

  registerZoomInButtonClick = (handleZoomInButtonClick) => {
    this.handleZoomInButtonClick = handleZoomInButtonClick;
  }

  registerZoomOutButtonClick = (handleZoomOutButtonClick) => {
    this.handleZoomOutButtonClick = handleZoomOutButtonClick;
  }

  registerZoomOutMapButtonClick = (handleZoomOutMapButtonClick) => {
    this.handleZoomOutMapButtonClick = handleZoomOutMapButtonClick;
  }

  registerZoomResetButtonClick = (handleZoomResetButtonClick) => {
    this.handleZoomResetButtonClick = handleZoomResetButtonClick;
  }

  handleGraphComponentSelect = (components) => {
    this.setState({
      selectedGraphComponents: components,
    });
  }

  handleGraphInitialized = () => {
    this.setState({
      graphInitialized: true,
    });
  }

  handleError = (error) => {
    if (error) {
      error.numLines = this.state.dotSrc.split('\n').length;
    }
    if (JSON.stringify(error) !== JSON.stringify(this.state.error)) {
      this.setState({
        error: error,
      });
    }
  }

  registerUndo = (undo) => {
    this.undo = undo;
  }

  registerRedo = (redo) => {
    this.redo = redo;
  }

  handleTextEditorFocus = () => {
    this.setFocus('TextEditor');
  }

  handleTextEditorBlur = () => {
    // Needed when the user clicks outside of a pane,
    // e.g. the app bar or the background
    this.setFocusIfFocusIs('TextEditor', null);
  }

  handleGraphFocus = () => {
    this.setFocus('Graph');
  }

  handleInsertPanelsClick = () => {
    this.setFocus('InsertPanels');
  }

  handleNodeFormatDrawerClick = () => {
    this.setFocusIf('nodeFormatDrawerIsOpen', 'NodeFormatDrawer', null)
  }

  handleEdgeFormatDrawerClick = () => {
    this.setFocus('EdgeFormatDrawer');
    this.setFocusIf('edgeFormatDrawerIsOpen', 'EdgeFormatDrawer', null)
  }

  setFocus = (focusedPane) => {
    this.setState((state) => (state.focusedPane !== focusedPane && {
      focusedPane: focusedPane,
    }) || null);
  }

  setFocusIfFocusIs = (currentlyFocusedPane, newFocusedPane) => {
    this.setState((state) => (state.focusedPane === currentlyFocusedPane && {
      focusedPane: newFocusedPane,
    }) || null);
  }

  setFocusIf = (stateProperty, focusedPaneIf, focusedPaneElse) => {
    this.setState((state) => {
      const focusedPane = state[stateProperty] ? focusedPaneIf: focusedPaneElse;
      return (state.focusedPane !== focusedPane && {
        focusedPane: focusedPane,
      }) || null;
    });
  }

  render() {
    const { classes } = this.props;
    const editorIsOpen = !this.state.nodeFormatDrawerIsOpen && !this.state.edgeFormatDrawerIsOpen;
    const textEditorHasFocus = this.state.focusedPane === 'TextEditor';
    const nodeFormatDrawerHasFocus = this.state.focusedPane === 'NodeFormatDrawer';
    const edgeFormatDrawerHasFocus = this.state.focusedPane === 'EdgeFormatDrawer';
    const insertPanelsHaveFocus = this.state.focusedPane === 'InsertPanels';
    const graphHasFocus = this.state.focusedPane === 'Graph';
    const leftPaneElevation = textEditorHasFocus || nodeFormatDrawerHasFocus || edgeFormatDrawerHasFocus? focusedElevation : defaultElevation;
    const rightPaneElevation = graphHasFocus ? focusedElevation : defaultElevation;
    const midPaneElevation = insertPanelsHaveFocus ? focusedElevation : defaultElevation;

    var columns;
    if (this.state.insertPanelsAreOpen && this.state.graphInitialized) {
      columns = {
        textEditor: 3,
        insertPanels: 3,
        graph: 6,
      }
    } else { /* browse */
      columns = {
        textEditor: 6,
        insertPanels: false,
        graph: 6,
      }
    }
    return (
      <div className={classes.root}>
        {/* FIXME: Find a way to get viz.js from the graphviz-visual-editor bundle */}
        <script src="https://unpkg.com/viz.js@1.8.2/viz.js" type="javascript/worker"></script>
        <ButtonAppBar
          onMenuButtonClick={this.handleMainMenuButtonClick}
          onUndoButtonClick={this.handleUndoButtonClick}
          onRedoButtonClick={this.handleRedoButtonClick}
          onInsertClick={this.handleInsertButtonClick}
          onNodeFormatClick={this.handleNodeFormatButtonClick}
          onEdgeFormatClick={this.handleEdgeFormatButtonClick}
          onZoomInButtonClick={this.handleZoomInButtonClick}
          onZoomOutButtonClick={this.handleZoomOutButtonClick}
          onZoomOutMapButtonClick={this.handleZoomOutMapButtonClick}
          onZoomResetButtonClick={this.handleZoomResetButtonClick}
          onSettingsButtonClick={this.handleSettingsClick}
          onOpenInBrowserButtonClick={this.handleOpenFromBrowserClick}
          onSaveAltButtonClick={this.handleSaveToBrowserAsClick}
          onHelpButtonClick={this.handleHelpButtonClick}
        >
        </ButtonAppBar>
        <MainMenu
          anchorEl={this.state.mainMenuAnchorEl}
          open={this.state.mainMenuIsOpen}
          onMenuClose={this.handleMainMenuClose}
          onSettingsClick={this.handleSettingsClick}
          onOpenFromBrowserClick={this.handleOpenFromBrowserClick}
          onSaveToBrowserAsClick={this.handleSaveToBrowserAsClick}
        />
        {this.state.settingsDialogIsOpen &&
          <SettingsDialog
            engine={this.state.engine}
            fitGraph={this.state.fitGraph}
            transitionDuration={this.state.transitionDuration}
            tweenPaths={this.state.tweenPaths}
            tweenShapes={this.state.tweenShapes}
            tweenPrecision={this.state.tweenPrecision}
            onEngineSelectChange={this.handleEngineSelectChange}
            onFitGraphSwitchChange={this.handleFitGraphSwitchChange}
            onTransitionDurationChange={this.handleTransitionDurationChange}
            onTweenPathsSwitchChange={this.handleTweenPathsSwitchChange}
            onTweenShapesSwitchChange={this.handleTweenShapesSwitchChange}
            onTweenPrecisionChange={this.handleTweenPrecisionChange}
            holdOff={this.state.holdOff}
            onHoldOffChange={this.handleHoldOffChange}
            fontSize={this.state.fontSize}
            onFontSizeChange={this.handleFontSizeChange}
            tabSize={this.state.tabSize}
            onTabSizeChange={this.handleTabSizeChange}
            onSettingsClose={this.handleSettingsClose}
          />
        }
        {this.state.openFromBrowserDialogIsOpen &&
          <OpenFromBrowserDialog
            projects={this.state.projects}
            dotSrc={this.state.dotSrc}
            dotSrcLastChangeTime={this.state.dotSrcLastChangeTime}
            name={this.state.name}
            onOpen={this.handleOpenFromBrowser}
            onClose={this.handleOpenFromBrowserClose}
          />
        }
        {this.state.saveToBrowserAsDialogIsOpen &&
          <SaveToBrowserAsDialog
            name={this.state.name}
            onSave={this.handleSaveToBrowserAs}
            onClose={this.handleSaveToBrowserAsClose}
          />
        }
        {this.state.doYouWantToReplaceItDialogIsOpen &&
          <DoYouWantToReplaceItDialog
            name={this.state.replaceName}
            onReplace={this.handleSaveToBrowserAs}
            onClose={this.handleDoYouWantToReplaceItClose}
          />
        }
        <Grid container
          spacing={24}
          style={{
            margin: 0,
            width: '100%',
          }}
        >
          <Grid item xs={columns.textEditor}>
            <Paper elevation={leftPaneElevation} className={classes.paper}>
              <FormatDrawer
                type='node'
                open={this.state.nodeFormatDrawerIsOpen}
                defaultAttributes={this.state.defaultNodeAttributes}
                onClick={this.handleNodeFormatDrawerClick}
                onFormatDrawerClose={this.handleNodeFormatDrawerClose}
                onStyleChange={this.handleNodeStyleChange}
                onColorChange={this.handleNodeColorChange}
                onFillColorChange={this.handleNodeFillColorChange}
              />
              <FormatDrawer
                type='edge'
                open={this.state.edgeFormatDrawerIsOpen}
                defaultAttributes={this.state.defaultEdgeAttributes}
                onClick={this.handleEdgeFormatDrawerClick}
                onFormatDrawerClose={this.handleEdgeFormatDrawerClose}
                onStyleChange={this.handleEdgeStyleChange}
                onColorChange={this.handleEdgeColorChange}
                onFillColorChange={this.handleEdgeFillColorChange}
              />
              <div style={{display: editorIsOpen ? 'block' : 'none'}}>
                <TextEditor
                  // allocated viewport width - 2 * padding
                  width={`calc(${columns.textEditor * 100 / 12}vw - 2 * 12px)`}
                  dotSrc={this.state.dotSrc}
                  onTextChange={this.handleTextChange}
                  onFocus={this.handleTextEditorFocus}
                  onBlur={this.handleTextEditorBlur}
                  error={this.state.error}
                  selectedGraphComponents={this.state.selectedGraphComponents}
                  holdOff={this.state.holdOff}
                  fontSize={this.state.fontSize}
                  tabSize={this.state.tabSize}
                  registerUndo={this.registerUndo}
                  registerRedo={this.registerRedo}
                />
              </div>
            </Paper>
          </Grid>
          {this.state.insertPanelsAreOpen && this.state.graphInitialized && (
              <Grid item xs={columns.insertPanels}>
                <Paper elevation={midPaneElevation} className={classes.paper}>
                  <InsertPanels
                    onClick={this.handleInsertPanelsClick}
                    onNodeShapeClick={this.handleNodeShapeClick}
                    onNodeShapeDragStart={this.handleNodeShapeDragStart}
                    onNodeShapeDragEnd={this.handleNodeShapeDragEnd}
                  />
                </Paper>
              </Grid>
          )}
          <Grid item xs={columns.graph}>
            <Paper elevation={rightPaneElevation} className={classes.paper}>
              <Graph
                hasFocus={graphHasFocus}
                dotSrc={this.state.dotSrc}
                engine={this.state.engine}
                fit={this.state.fitGraph}
                transitionDuration={this.state.transitionDuration}
                tweenPaths={this.state.tweenPaths}
                tweenShapes={this.state.tweenShapes}
                tweenPrecision={this.state.tweenPrecision}
                defaultNodeAttributes={this.state.defaultNodeAttributes}
                defaultEdgeAttributes={this.state.defaultEdgeAttributes}
                onFocus={this.handleGraphFocus}
                onTextChange={this.handleTextChange}
                onHelp={this.handleKeyboardShortcutsClick}
                onSelect={this.handleGraphComponentSelect}
                onUndo={this.undo}
                onRedo={this.redo}
                registerNodeShapeClick={this.registerNodeShapeClick}
                registerNodeShapeDragStart={this.registerNodeShapeDragStart}
                registerNodeShapeDragEnd={this.registerNodeShapeDragEnd}
                registerZoomInButtonClick={this.registerZoomInButtonClick}
                registerZoomOutButtonClick={this.registerZoomOutButtonClick}
                registerZoomOutMapButtonClick={this.registerZoomOutMapButtonClick}
                registerZoomResetButtonClick={this.registerZoomResetButtonClick}
                onInitialized={this.handleGraphInitialized}
                onError={this.handleError}
              />
            </Paper>
          </Grid>
        </Grid>
        <HelpMenu
          anchorEl={this.state.helpMenuAnchorEl}
          open={this.state.helpMenuIsOpen}
          onMenuClose={this.handleHelpMenuClose}
          onKeyboardShortcutsClick={this.handleKeyboardShortcutsClick}
          onMouseOperationsClick={this.handleMouseOperationsClick}
          onAboutClick={this.handleAboutClick}
        />
        <KeyboardShortcutsDialog
          open={this.state.keyboardShortcutsDialogIsOpen}
          onKeyboardShortcutsDialogClose={this.handleKeyboardShortcutsDialogClose}
        />
        <MouseOperationsDialog
          open={this.state.mouseOperationsDialogIsOpen}
          onMouseOperationsDialogClose={this.handleMouseOperationsDialogClose}
        />
        <AboutDialog
          open={this.state.aboutDialogIsOpen}
          onAboutDialogClose={this.handleAboutDialogClose}
        />
      </div>
    );
  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withRoot(withStyles(styles)(Index));

var Urls, about, absPath, activeTabExists, addEditorTab, addToFileTree, addTreeContextMenu, adjustFileSuffix, attachEditor, attachWaveformViewer, buildFolderId, clearAllGrids, clearErrorLogs, clearInfoLogs, clearWarningLogs, closeFile, closeTab, confirmationDialog, contextId, copyFile, createAceTab, createFolder, createNode, createWaveformTab, cutFile, defaultFontSize, defaultThemeIndex, deleteChildren, deleteFile, deleteNode, deleteTreeFileType, dialogBox, disableMenuItem, displayError, displayInfo, displayMessage, displaySuccess, displayWarning, duplicateFile, editorTabs, enableMenuItem, encodeParams, excludeFromBuild, extractModules, fileDialog, fileIds, fileTree, filesContent, filesTree, findAction, forceCloseTab, generateId, getActiveEditor, getActiveEditorTabContent, getActiveEditorTabId, getActiveEditorTabIndex, getActiveWaveform, getAllTabs, getBuildFolderNode, getCommentsRegEx, getEditorTabCount, getModuleRegEx, getMultiCommentsRegEx, getNetlistFiles, getNodeById, getNodeIndex, getParentTargetNode, getProjectSettings, getProjectTree, getSelectedNode, getSelectedNodeId, getStandardCells, getTabById, getTargetNode, getTopFolderNode, getValidModuleRegEx, getVerilogFiles, hasChild, hideEditorSnippet, hideMenuItem, highlightedId, includeInBuild, isFolderNode, isNodeOpen, loadingOff, loadingOn, logError, logInfo, logMessage, logWarning, menuItems, menubar, moduleDialog, nameAndOptionDialog, newFolder, newTestbench, newVerilog, onSplitterDrag, openFile, openFileById, openNode, optionsDialog, pasteFile, pasteId, promptCopy, promptDialog, redoAction, refreshMenus, refreshTree, renameFile, renameNode, replaceAction, request, resizeHanlder, retrieveFile, saveAll, saveFile, saveOpenTab, searchClearead, searchDialog, searchFile, selectAll, selectNode, setActiveEditorTab, setActiveEditorTabById, setLogTab, setNodeId, setTabTitle, setTopModule, setTreeData, setupIDE, showMenuItem, simulate, synthesisDialog, synthesize, tabCounter, tabTemplate, toolbar, topModule, topModuleFileId, undoAction, updateTreeFileName, updateTreeFileParent, updateTreeFileType, workspaceSettings, workspaceSettingsDialog;

$(document).ready(function(e) {
  return $('#loading-screen').remove();
});
defaultFontSize = 15;
defaultThemeIndex = 0;
Urls = {
  stdcell: '/stdcell',
  compile: '/compile',
  simulate: '/simulate'
};
filesContent = {};
fileTree = [];
fileIds = [];
topModule = '';
topModuleFileId = '';
buildFolderId = '';
filesTree = [];
request = function(url, method, params, successCB, errorCB) {
  var requestBody;
  if (typeof params === 'function') {
    errorCB = successCB;
    successCB = params;
    params = {};
  }
  requestBody = {
    type: method,
    url: window.location.protocol + "//" + window.location.host + url,
    async: true,
    contentType: 'application/json',
    data: JSON.stringify(params) || '',
    success: function(res) {
      return successCB(res);
    },
    error: function(error) {
      var e, err;
      try {
        err = JSON.parse(error.responseText);
        return errorCB(err);
      } catch (error1) {
        e = error1;
        return errorCB({
          error: error.responseText
        });
      }
    }
  };
  return $.ajax(requestBody);
};
generateId = function(prefix) {
  var id;
  id = (prefix || 'id') + '_' + Math.random().toString().slice(2) + '_' + (new Date()).getTime();
  while (fileIds.indexOf(id) >= 0) {
    id = (prefix || 'id') + '_' + Math.random().toString().slice(2) + '_' + (new Date()).getTime();
  }
  fileIds.push(id);
  return id;
};
absPath = function(path) {
  if (!location.origin) {
    location.origin = location.protocol + "//" + location.host;
  }
  return location.origin + "/IDE/" + path;
};
encodeParams = function(data) {
  return Object.keys(data).map(function(key) {
    return [key, data[key]].map(encodeURIComponent).join('=');
  }).join('&');
};
getValidModuleRegEx = function() {
  return new RegExp('^[\\w\\.]+$', 'g');
};
getModuleRegEx = function() {
  return new RegExp('^\\s*module\\s+(.+?)\\s*(#\\s*\\(([\\s\\S]+?)\\)\\s*)??\\s*((\\([\\s\\S]*?\\))?\\s*;)([\\s\\S]*?)endmodule', 'gm');
};
extractModules = function(content) {
  var moduleMatches, moduleName, moduleRegEx, modules;
  if (content == null) {
    content = '';
  }
  content = content.replace(getCommentsRegEx(), '').replace(getMultiCommentsRegEx(), '');
  moduleRegEx = getModuleRegEx();
  modules = [];
  moduleMatches = moduleRegEx.exec(content);
  while (moduleMatches !== null) {
    moduleName = moduleMatches[1];
    if (modules.indexOf(moduleName) < 0) {
      modules.push(moduleName.trim());
    }
    moduleMatches = moduleRegEx.exec(content);
  }
  return modules;
};
getCommentsRegEx = function() {
  return new RegExp('\\/\\/.*$', 'gm');
};
getMultiCommentsRegEx = function() {
  return new RegExp('\\/\\*(.|[\\r\\n])*?\\*\\/', 'gm');
};
loadingOn = function(loadingText) {
  if (loadingText == null) {
    loadingText = 'Please wait..';
  }
  $('#loading-text').text(loadingText);
  return $("#loading-div-background").show();
};
loadingOff = function() {
  return $("#loading-div-background").hide();
};
displayMessage = function(message, type) {
  if ((message == null) || typeof message !== 'string' || message.trim() === '') {
    message = "Unkown error has occurred.";
  }
  return noty({
    text: message,
    type: type,
    theme: 'relax',
    layout: 'topCenter',
    timeout: 3000,
    animation: {
      open: 'animated fadeIn',
      close: 'animated fadeOut',
      speed: 500
    }
  });
};
displayError = function(errorMessage) {
  return displayMessage(errorMessage.error || errorMessage, 'error');
};
displayWarning = function(warningMessage) {
  return displayMessage(warningMessage, 'warning');
};
displayInfo = function(infoMessage) {
  return displayMessage(infoMessage, 'information');
};
displaySuccess = function(successMessage) {
  return displayMessage(successMessage, 'success');
};
logMessage = function(messageObject, elementId) {
  var messageEl;
  messageEl = $("<li class=\"ui-widget-content\">" + messageObject.message + "</li>");
  $("#" + elementId).append(messageEl);
  if (messageObject.file != null) {
    messageEl.data('fileId', messageObject.file);
    messageEl.data('line', messageObject.line);
  }
  return messageEl.dblclick(function(e) {
    var fileId, lineNumber, thisMessage;
    thisMessage = $(this);
    fileId = thisMessage.data('fileId');
    lineNumber = thisMessage.data('line');
    if (fileId != null) {
      selectNode(fileId);
      if (getSelectedNodeId() === fileId) {
        return openFile(false, function(err) {
          var editor;
          if (err) {
            return displayError(err);
          } else {
            if (typeof lineNumber === 'number') {
              editor = getActiveEditor();
              if (editor) {
                return editor.gotoLine(lineNumber);
              }
            }
          }
        });
      }
    }
  });
};
logError = function(errorObject) {
  return logMessage(errorObject, 'error-list');
};
logWarning = function(warningObject) {
  return logMessage(warningObject, 'warning-list');
};
logInfo = function(infoObject) {
  return logMessage(infoObject, 'console-list');
};
clearErrorLogs = function() {
  return $('#error-list').html('');
};
clearWarningLogs = function() {
  return $('#warning-list').html('');
};
clearInfoLogs = function() {
  return $('#console-list').html('');
};
clearAllGrids = function() {
  clearErrorLogs();
  clearWarningLogs();
  return clearInfoLogs();
};
setLogTab = function(index) {
  var indexMap, ref, ref1;
  if (typeof index === 'string') {
    if ((ref = !index) === 'console' || ref === 'error' || ref === 'warning') {
      return;
    }
    indexMap = {
      console: 0,
      error: 1,
      warning: 2
    };
    index = indexMap[index];
  } else if (typeof index === 'number') {
    if ((ref1 = !index) === 0 || ref1 === 1 || ref1 === 2) {
      return;
    }
  } else {
    return;
  }
  return $('#log-tabs').tabs({
    active: index,
    heightStyle: 'fill'
  });
};
$('#console-list').selectable({
  autoRefresh: true,
  cancel: '.ui-selected',
  stop: function(event, ui) {
    return $(event.target).children('.ui-selected').not(':first').removeClass('ui-selected');
  }
});
$('#error-list').selectable({
  autoRefresh: true,
  cancel: '.ui-selected',
  stop: function(event, ui) {
    return $(event.target).children('.ui-selected').not(':first').removeClass('ui-selected');
  }
});
$('#warning-list').selectable({
  autoRefresh: true,
  cancel: '.ui-selected',
  stop: function(event, ui) {
    return $(event.target).children('.ui-selected').not(':first').removeClass('ui-selected');
  }
});
onSplitterDrag = function(e) {
  $('#log-tabs').tabs('refresh');
  $('#editor-tabs').tabs('refresh');
  return resizeHanlder();
};
Split(['#files', '#editors-logs'], {
  sizes: [20, 80],
  gutterSize: 8,
  cursor: 'col-resize',
  onDrag: onSplitterDrag
});
Split(['#editors', '#logs'], {
  direction: 'vertical',
  sizes: [70, 30],
  gutterSize: 8,
  cursor: 'col-resize',
  onDrag: onSplitterDrag
});
$('#menu').mnmenu();
highlightedId = null;
contextId = null;
adjustFileSuffix = function(fileName, suffix) {
  if (fileName.indexOf(suffix, fileName.length - suffix.length) !== -1) {
    fileName = fileName.substring(0, fileName.length - suffix.length);
  }
  return fileName;
};
confirmationDialog = function(title, htmlContent, cb, width, height) {
  var confirmed;
  if (width == null) {
    width = 350;
  }
  if (height == null) {
    height = 150;
  }
  $('#dialog-confirm').html(htmlContent);
  confirmed = false;
  return $("#dialog-confirm").dialog({
    resizable: false,
    modal: true,
    title: title,
    height: height,
    width: width,
    buttons: {
      'OK': function() {
        confirmed = true;
        return $(this).dialog('close');
      },
      'Cancel': function() {
        return $(this).dialog('close');
      }
    },
    close: function() {
      return cb(confirmed);
    }
  });
};
promptDialog = function(title, htmlContent, cb, width, height) {
  var accepted, cancelled;
  if (width == null) {
    width = 350;
  }
  if (height == null) {
    height = 150;
  }
  $('#dialog-confirm').html(htmlContent);
  accepted = false;
  cancelled = false;
  return $("#dialog-confirm").dialog({
    resizable: false,
    modal: true,
    title: title,
    height: height,
    width: width,
    buttons: {
      'Yes': function() {
        accepted = true;
        return $(this).dialog('close');
      },
      'No': function() {
        return $(this).dialog('close');
      },
      'Cancel': function() {
        cancelled = true;
        return $(this).dialog('close');
      }
    },
    close: function() {
      return cb(accepted, cancelled);
    }
  });
};
dialogBox = function(title, htmlContent, width, height) {
  if (width == null) {
    width = 350;
  }
  if (height == null) {
    height = 180;
  }
  $('#dialog-box').html(htmlContent);
  return $("#dialog-box").dialog({
    resizable: false,
    modal: true,
    title: title,
    height: height,
    width: width,
    buttons: {
      'OK': function() {
        return $(this).dialog('close');
      }
    },
    close: function() {
      return $('#dialog-box').html('');
    }
  });
};
getSelectedNodeId = function() {
  var selected;
  selected = $('#files').jstree('get_selected');
  if ((selected == null) || selected.length !== 1) {
    return false;
  } else {
    return selected[0];
  }
};
getNodeById = function(id) {
  return $('#files').jstree(true).get_node(id);
};
getSelectedNode = function() {
  var selectedId;
  selectedId = getSelectedNodeId();
  if (!selectedId) {
    return false;
  } else {
    return getNodeById(selectedId);
  }
};
getTargetNode = function(isContext) {
  if (isContext == null) {
    isContext = false;
  }
  if (isContext) {
    return getNodeById(contextId);
  } else {
    return getSelectedNode();
  }
};
getParentTargetNode = function(isContext) {
  if (isContext == null) {
    isContext = false;
  }
  if (isContext) {
    return getNodeById(contextId);
  } else {
    return getTopFolderNode();
  }
};
isFolderNode = function(nodeType) {
  return nodeType === 'folder' || nodeType === 'buildFolder' || nodeType === 'root';
};
getTopFolderNode = function() {
  var parentId, parentNode, rootId, selectedNode;
  selectedNode = getSelectedNode();
  if (!selectedNode) {
    rootId = getNodeById('#').children;
    if (rootId.length === 0) {
      return '';
    } else {
      return getNodeById(rootId[0]);
    }
  } else {
    if (isFolderNode(selectedNode.type)) {
      return selectedNode;
    } else {
      parentId = selectedNode.parent;
      parentNode = getNodeById(parentId);
      while (!isFolderNode(parentNode.type)) {
        parentId = parentNode.parent;
        parentNode = getNodeById(parentId);
      }
      return parentNode;
    }
  }
};
getBuildFolderNode = function() {
  var childId, childNode, j, len, rootChildren;
  if (buildFolderId != null) {
    return getNodeById(buildFolderId);
  }
  rootChildren = getNodeById(getNodeById('#').children[0]).children;
  for (j = 0, len = rootChildren.length; j < len; j++) {
    childId = rootChildren[j];
    childNode = getNodeById(childId);
    if (childNode.type === 'buildFolder') {
      buildFolderId = childId;
      return childNode;
    }
  }
  return false;
};
isNodeOpen = function(id) {
  return $('#files').jstree('is_open', id);
};
openNode = function(id) {
  var parentId, results;
  $('#files').jstree('open_node', id);
  parentId = getNodeById(id).parent;
  results = [];
  while ((id != null) && id !== '#' && (parentId != null) && parentId !== '#') {
    $('#files').jstree('open_node', parentId);
    results.push(parentId = getNodeById(parentId).parent);
  }
  return results;
};
addToFileTree = function(nodeId, parentId, nodeText, type) {
  var typeClass;
  typeClass = 'tree-item tree-file-item';
  if (type === 'folder' || type === 'buildFolder') {
    typeClass = 'tree-item tree-folder-item';
  } else if (type === 'root') {
    typeClass = 'tree-item tree-root-item';
  } else if (type === 'module') {
    typeClass = 'tree-item tree-module-item';
  }
  return filesTree.push({
    id: nodeId,
    parent: parentId,
    text: nodeText,
    li_attr: {
      "class": typeClass
    },
    type: type
  });
};
updateTreeFileName = function(nodeId, newName) {
  var file, j, len;
  for (j = 0, len = filesTree.length; j < len; j++) {
    file = filesTree[j];
    if (file.id === nodeId) {
      file.text = newName;
      return true;
    }
  }
  return false;
};
updateTreeFileParent = function(nodeId, newParent) {
  var file, j, len;
  for (j = 0, len = filesTree.length; j < len; j++) {
    file = filesTree[j];
    if (file.id === nodeId) {
      file.parent = newParent;
      return true;
    }
  }
  return false;
};
updateTreeFileType = function(nodeId, newType) {
  var file, j, len, typeClass;
  typeClass = 'tree-item tree-file-item';
  if (newType === 'folder' || newType === 'buildFolder') {
    typeClass = 'tree-item tree-folder-item';
  } else if (newType === 'root') {
    typeClass = 'tree-item tree-root-item';
  } else if (newType === 'module') {
    typeClass = 'tree-item tree-module-item';
  }
  for (j = 0, len = filesTree.length; j < len; j++) {
    file = filesTree[j];
    if (file.id === nodeId) {
      file.type = newType;
      file.li_attr["class"] = typeClass;
      return true;
    }
  }
  return false;
};
deleteTreeFileType = function(nodeId) {
  return filesTree[nodeId] = void 0;
};
createNode = function(nodeId, parentId, nodeText, type, pos) {
  var typeClass;
  if (pos == null) {
    pos = 'last';
  }
  typeClass = 'tree-file-item';
  if (type === 'folder' || type === 'buildFolder') {
    typeClass = 'tree-folder-item';
  } else if (type === 'root') {
    typeClass = 'tree-root-item';
  } else if (type === 'module') {
    typeClass = 'tree-module-item';
  }
  $('#files').jstree(true).create_node(parentId, {
    id: nodeId,
    text: nodeText,
    type: type,
    li_attr: {
      "class": "tree-item " + typeClass
    }
  }, pos, (function(createdNode) {
    if (!isNodeOpen(parentId)) {
      openNode(parentId);
    }
    if (type === 'root') {
      openNode(nodeId);
    }
    return addToFileTree(nodeId, parentId, nodeText, type);
  }));
  return getNodeById(nodeId);
};
getNodeIndex = function(node) {
  if (typeof node === 'string') {
    node = getNodeById(node);
  }
  return getNodeById(node.parent).children.indexOf(node.id);
};
createFolder = function(folderId, parentId, folderText) {
  return createNode(folderId, parentId, folderText, 'folder');
};
deleteNode = function(id) {
  $('#files').jstree(true).delete_node(id);
  return forceCloseTab("tabs-" + id);
};
renameNode = function(id) {
  if (typeof id === 'string') {
    id = getNodeById(id);
  }
  return $('#files').jstree(true).rename_node(id, oldName);
};
selectNode = function(id) {
  $('#files').jstree(true).deselect_all();
  return $("#files").jstree("select_node", id).trigger("select_node.jstree");
};
deleteChildren = function(id) {
  var childId, j, len, parentNode, ref;
  parentNode = getNodeById(id);
  if (parentNode) {
    ref = parentNode.children;
    for (j = 0, len = ref.length; j < len; j++) {
      childId = ref[j];
      deleteNode(childId);
    }
    return true;
  } else {
    return false;
  }
};
setNodeId = function(id, newId) {
  return $('#files').jstree('set_id', id, newId);
};
hasChild = function(parentId, childText) {
  var childId, j, len, parentNode, ref;
  parentNode = getNodeById(parentId);
  ref = parentNode.children;
  for (j = 0, len = ref.length; j < len; j++) {
    childId = ref[j];
    if (getNodeById(childId).text === childText) {
      return childId;
    }
  }
  return false;
};
hideMenuItem = function(itemId) {
  return $("#menu-" + itemId).hide();
};
showMenuItem = function(itemId) {
  return $("#menu-" + itemId).show();
};
enableMenuItem = function(itemId) {
  return $("#menu-" + itemId).removeClass('disabled-menu-item');
};
disableMenuItem = function(itemId) {
  var item;
  item = $("#menu-" + itemId);
  if (!item.hasClass('disabled-menu-item')) {
    return item.addClass('disabled-menu-item');
  }
};
fileDialog = function(title, message, defaultValue, parentNode, suffix, cb) {
  var confirmed, fileTitle, htmlContent, matchId, overwrite;
  if (suffix == null) {
    suffix = '';
  }
  htmlContent = "<form action=\"#\" id=\"new-file-form\">\n	<fieldset class=\"ui-helper-reset\">\n		<label for=\"file_title\">" + message + "</label>\n		<input type=\"text\" name=\"file_title\" id=\"file_title\" value=\"" + defaultValue + "\" class=\"ui-widget-content ui-corner-all\">\n	</fieldset>\n</form>";
  $('#prompt-dialog').html(htmlContent);
  $('#new-file-form').on('submit', function(e) {
    e.preventDefault();
    return e.stopPropagation();
  });
  confirmed = false;
  fileTitle = '';
  overwrite = false;
  matchId = null;
  $("#prompt-dialog").dialog({
    resizable: false,
    modal: true,
    title: title,
    height: 130,
    width: 320,
    buttons: {
      'Create': function() {
        var dialogMessage, dialogTitle, thisContainer;
        fileTitle = $('#file_title').val();
        if (fileTitle.trim() === '') {
          return;
        }
        fileTitle = adjustFileSuffix(fileTitle, suffix);
        fileTitle = "" + fileTitle + suffix;
        thisContainer = $(this);
        if (matchId = hasChild(parentNode.id, fileTitle)) {
          dialogTitle = "Overwrite " + fileTitle;
          dialogMessage = "<p><span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:0 7px 20px 0;\"></span>\"" + fileTitle + "\" already exists. Are you sure you want to overwrite it?</p>";
          return confirmationDialog(dialogTitle, dialogMessage, function(accepted) {
            if (accepted) {
              confirmed = true;
              overwrite = true;
              return thisContainer.dialog('close');
            }
          });
        } else {
          confirmed = true;
          return thisContainer.dialog('close');
        }
      },
      'Cancel': function() {
        return $(this).dialog('close');
      }
    },
    close: function() {
      $('#prompt-dialog').html('');
      return cb(confirmed, fileTitle, overwrite, matchId);
    }
  });
  return $("#prompt-dialog").keypress(function(e) {
    var createButton;
    if (e.keyCode === 13) {
      createButton = $('#prompt-dialog').parent().find('.ui-button:contains(\"Create\")');
      createButton.click();
      e.preventDefault();
      return e.stopPropagation();
    }
  });
};
moduleDialog = function(title, message, defaultValue, parentNode, suffix, cb) {
  var confirmed, fileTitle, htmlContent, matchId, overwrite, seq;
  if (suffix == null) {
    suffix = '';
  }
  htmlContent = "<form action=\"#\" id=\"new-file-form\">\n	<fieldset class=\"ui-helper-reset\">\n		<label for=\"file_title\">" + message + "</label>\n		<input type=\"text\" name=\"file_title\" id=\"file_title\" value=\"" + defaultValue + "\" class=\"ui-widget-content ui-corner-all\">\n                <div class =\"synth-checkbox-div\">\n                    <label class=\"ui-widget ui-corner-all synth-checkbox-label\" for=\"seq\"><input type=\"checkbox\" id=\"seq\" class=\"ui-widget ui-corner-all synth-checkbox\"><span class=\"synth-checkbox-text\">Sequential</span></label>\n                </div>\n            </fieldset>\n</form>";
  $('#prompt-dialog').html(htmlContent);
  $('#new-file-form').on('submit', function(e) {
    e.preventDefault();
    return e.stopPropagation();
  });
  confirmed = false;
  fileTitle = '';
  overwrite = false;
  matchId = null;
  seq = false;
  $("#prompt-dialog").dialog({
    resizable: false,
    modal: true,
    title: title,
    height: 160,
    width: 320,
    buttons: {
      'Create': function() {
        var dialogMessage, dialogTitle, thisContainer;
        fileTitle = $('#file_title').val();
        if (fileTitle.trim() === '') {
          return;
        }
        seq = $('#seq').is(':checked');
        fileTitle = adjustFileSuffix(fileTitle, suffix);
        fileTitle = "" + fileTitle + suffix;
        thisContainer = $(this);
        if (matchId = hasChild(parentNode.id, fileTitle)) {
          dialogTitle = "Overwrite " + fileTitle;
          dialogMessage = "<p><span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:0 7px 20px 0;\"></span>\"" + fileTitle + "\" already exists. Are you sure you want to overwrite it?</p>";
          return confirmationDialog(dialogTitle, dialogMessage, function(accepted) {
            if (accepted) {
              confirmed = true;
              overwrite = true;
              return thisContainer.dialog('close');
            }
          });
        } else {
          confirmed = true;
          return thisContainer.dialog('close');
        }
      },
      'Cancel': function() {
        return $(this).dialog('close');
      }
    },
    close: function() {
      $('#prompt-dialog').html('');
      return cb(confirmed, fileTitle, overwrite, matchId, seq);
    }
  });
  return $("#prompt-dialog").keypress(function(e) {
    var createButton;
    if (e.keyCode === 13) {
      createButton = $('#prompt-dialog').parent().find('.ui-button:contains(\"Create\")');
      createButton.click();
      e.preventDefault();
      return e.stopPropagation();
    }
  });
};
workspaceSettingsDialog = function(currentThemeIndex, currentFontSize, cb) {
  var confirmed, defaultSettings, fontList, fontSize, htmlContent, i, keyPressHandler, optionsList, themeIndex;
  optionsList = "";
  fontList = "";
  if (currentThemeIndex === 0) {
    optionsList = "<select class=\"prompt-select\" name=\"theme\" tabindex=\"0\" id=\"options-list\">\n<option value=\"0\" selected>Dark</option>\n<option value=1>Light</option>\n</select>";
  } else {
    optionsList = "<select class=\"prompt-select\" name=\"options-list\" tabindex=\"0\" id=\"options-list\">\n<option value=\"0\">Dark</option>\n<option value=1 selected>Light</option>\n</select>";
  }
  i = 6;
  while (i <= 60) {
    if (i === currentFontSize) {
      fontList = "\t" + fontList + "<option value=\"" + i + "\" selected>" + i + "</option>\n";
    } else {
      fontList = "\t" + fontList + "<option value=\"" + i + "\">" + i + "</option>\n";
    }
    if (i < 16) {
      i++;
    } else if (i < 32) {
      i += 2;
    } else if (i < 48) {
      i += 4;
    } else {
      i += 6;
    }
  }
  fontList = "<select class=\"prompt-select\" name=\"font\" tabindex=\"0\" id=\"font\">\n" + fontList + "\n</select>";
  htmlContent = "<form action=\"#\" id=\"new-file-form\">\n	<fieldset class=\"ui-helper-reset\">\n                <div>\n        			<label for=\"theme\">Theme:</label>\n                    <br>\n                    <br>\n            			" + optionsList + "\n                    <br>\n                    <br>\n                </div>\n		<label for=\"font\">Font Size:</label>\n                <br>\n                <br>\n		" + fontList + "\n                <br>\n                <br>\n                <div class =\"synth-checkbox-div\">\n                    <label class=\"ui-widget ui-corner-all synth-checkbox-label\" for=\"defaultSettings\"><input type=\"checkbox\" name=\"defaultSettings\" id=\"defaultSettings\" class=\"ui-widget ui-corner-all synth-checkbox\"><span class=\"synth-checkbox-text\">Remember these settings for upcoming projects</span></label>\n                </div>\n            </fieldset>\n</form>";
  $('#prompt-dialog').html(htmlContent);
  $('#new-file-form').on('submit', function(e) {
    e.preventDefault();
    return e.stopPropagation();
  });
  confirmed = false;
  themeIndex = null;
  fontSize = null;
  defaultSettings = false;
  $("#prompt-dialog").dialog({
    resizable: false,
    modal: true,
    title: 'Workspace Settings',
    height: 300,
    width: 320,
    buttons: {
      'Submit': function() {
        var thisContainer;
        themeIndex = parseInt($('#options-list').val());
        fontSize = parseInt($('#font').val());
        defaultSettings = $('#defaultSettings').is(':checked');
        if (isNaN(themeIndex) || isNaN(fontSize)) {
          return;
        }
        thisContainer = $(this);
        confirmed = true;
        return thisContainer.dialog('close');
      },
      'Cancel': function() {
        return $(this).dialog('close');
      }
    },
    close: function() {
      $('#prompt-dialog').html('');
      return cb(confirmed, themeIndex, fontSize, defaultSettings);
    }
  });
  keyPressHandler = function(e) {
    var createButton;
    if (e.keyCode === 13) {
      createButton = $('#prompt-dialog').parent().find('.ui-button:contains(\"Submit\")');
      createButton.click();
      e.preventDefault();
      return e.stopPropagation();
    }
  };
  $('#prompt-dialog').parent().keypress(keyPressHandler);
  $('#options-list').selectmenu().addClass('prompt-overflow');
  $('#font').selectmenu().addClass('prompt-overflow');
  return $('#prompt-dialog').parent().focus();
};
searchDialog = function(title, message, defaultValue, cb) {
  var confirmed, htmlContent, searchQuery;
  htmlContent = "<form action=\"#\" id=\"new-file-form\">\n	<fieldset class=\"ui-helper-reset\">\n		<label for=\"search_query\">" + message + "</label>\n		<input type=\"text\" name=\"search_query\" id=\"search_query\" value=\"" + defaultValue + "\" class=\"ui-widget-content ui-corner-all\">\n	</fieldset>\n</form>";
  $('#prompt-dialog').html(htmlContent);
  $('#new-file-form').on('submit', function(e) {
    e.preventDefault();
    return e.stopPropagation();
  });
  confirmed = false;
  searchQuery = '';
  $("#prompt-dialog").dialog({
    resizable: false,
    modal: true,
    title: title,
    height: 130,
    width: 320,
    buttons: {
      'Search': function() {
        var thisContainer;
        searchQuery = $('#search_query').val();
        if (searchQuery.trim() === '') {
          return;
        }
        thisContainer = $(this);
        confirmed = true;
        return thisContainer.dialog('close');
      },
      'Cancel': function() {
        return $(this).dialog('close');
      }
    },
    close: function() {
      $('#prompt-dialog').html('');
      return cb(confirmed, searchQuery);
    }
  });
  return $("#prompt-dialog").keypress(function(e) {
    var createButton;
    if (e.keyCode === 13) {
      createButton = $('#prompt-dialog').parent().find('.ui-button:contains(\"Search\")');
      createButton.click();
      e.preventDefault();
      return e.stopPropagation();
    }
  });
};
synthesisDialog = function(stdcells, cb) {
  var confirmed, fileTitle, firstSelected, htmlContent, j, keyPressHandler, len, matchId, option, options, optionsList, overwrite, stdcell;
  optionsList = "";
  firstSelected = false;
  for (j = 0, len = stdcells.length; j < len; j++) {
    option = stdcells[j];
    if (!firstSelected) {
      optionsList = "\t" + optionsList + "<option value=\"" + option.id + "\">" + option.text + "</option>\n";
      firstSelected = true;
    } else {
      optionsList = "\t" + optionsList + "<option value=\"" + option.id + "\">" + option.text + "</option>\n";
    }
  }
  optionsList = "<select class=\"prompt-select\" name=\"options-list\" tabindex=\"0\" id=\"options-list\">\n" + optionsList + "</select>";
  htmlContent = "<form action=\"#\" id=\"new-file-form\">\n	<fieldset class=\"ui-helper-reset prompt-fieldset\">\n                <label for=\"file_title\">Netlist File Name: </label>\n                <input type=\"text\" name=\"file_title\" id=\"file_title\" value=\"netlist.v\" class=\"ui-widget-content ui-corner-all\">\n		<label for=\"options-list\" class=\"prompt-label module-label\">Standard Cell Library</label>\n		" + optionsList + "\n                <div class=\"synth-options\" id=\"synth-options\">\n                    <div class =\"synth-checkbox-div\">\n                        <label class=\"ui-widget ui-corner-all synth-checkbox-label\" for=\"synth-flatten\"><input type=\"checkbox\" id=\"synth-flatten\" class=\"ui-widget ui-corner-all synth-checkbox\" checked><span class=\"synth-checkbox-text\">flatten</span></label>\n                    </div>\n                    <div class =\"synth-checkbox-div\">\n                        <label class=\"ui-widget ui-corner-all synth-checkbox-label\" for=\"synth-purge\"><input type=\"checkbox\" id=\"synth-purge\" class=\"ui-widget ui-corner-all synth-checkbox\" checked><span class=\"synth-checkbox-text\">purge</span></label>\n                    </div>\n                    <div class =\"synth-checkbox-div\">\n                        <label class=\"ui-widget ui-corner-all synth-checkbox-label\" for=\"synth-proc\"><input type=\"checkbox\" id=\"synth-proc\" class=\"ui-widget ui-corner-all synth-checkbox\" checked><span class=\"synth-checkbox-text\">proc</span></label>\n                    </div>\n                    <div class =\"synth-checkbox-div\">\n                        <label class=\"ui-widget ui-corner-all synth-checkbox-label\" for=\"synth-memorymap\"><input type=\"checkbox\" id=\"synth-memorymap\" class=\"ui-widget ui-corner-all synth-checkbox\" checked><span class=\"synth-checkbox-text\">memory_map</span></label>\n                    </div>\n                </div>\n	</fieldset>\n</form>";
  $("#prompt-dialog").html(htmlContent);
  confirmed = false;
  fileTitle = '';
  stdcell = (stdcells[0] || {
    id: 0
  }).id;
  options = {
    flatten: true,
    purge: true,
    proc: true
  };
  overwrite = false;
  matchId = null;
  $("#prompt-dialog").dialog({
    resizable: false,
    modal: true,
    title: 'Enter synthesis options..',
    height: 220,
    width: 380,
    buttons: {
      'Synthesize': function() {
        var dialogMessage, dialogTitle, thisContainer;
        fileTitle = $('#file_title').val();
        if (fileTitle.trim() === '') {
          return;
        }
        stdcell = $('#options-list').val();
        if (stdcell.trim() === '') {
          return;
        }
        fileTitle = adjustFileSuffix(fileTitle, '.v');
        fileTitle = fileTitle + ".v";
        options.flatten = $('#synth-flatten').is(':checked');
        options.purge = $('#synth-purge').is(':checked');
        options.proc = $('#synth-proc').is(':checked');
        options.memorymap = $('#synth-memorymap').is(':checked');
        thisContainer = $(this);
        if (matchId = hasChild(getBuildFolderNode().id, fileTitle)) {
          dialogTitle = "Overwrite " + fileTitle;
          dialogMessage = "<p><span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:0 7px 20px 0;\"></span>\"" + fileTitle + "\" already exists. Are you sure you want to overwrite it?</p>";
          return confirmationDialog(dialogTitle, dialogMessage, function(accepted) {
            if (accepted) {
              confirmed = true;
              overwrite = true;
              return thisContainer.dialog('close');
            }
          });
        } else {
          confirmed = true;
          return thisContainer.dialog('close');
        }
      },
      'Cancel': function() {
        return $(this).dialog('close');
      }
    },
    close: function() {
      $('#prompt-dialog').html('');
      return cb(confirmed, fileTitle, stdcell, options, overwrite, matchId);
    }
  });
  keyPressHandler = function(e) {
    var createButton;
    if (e.keyCode === 13) {
      createButton = $('#prompt-dialog').parent().find('.ui-button:contains(\"Select\")');
      createButton.click();
      e.preventDefault();
      return e.stopPropagation();
    }
  };
  $('#prompt-dialog').parent().keypress(keyPressHandler);
  $('#options-list').selectmenu().addClass('prompt-overflow');
  return $('#prompt-dialog').parent().focus();
};
nameAndOptionDialog = function(title, nameMessage, defaultValue, optionsMessage, options, parentNode, suffix, cb) {
  var confirmed, fileTitle, firstSelected, htmlContent, j, keyPressHandler, len, matchId, moduleName, option, optionsList, overwrite;
  if (suffix == null) {
    suffix = '';
  }
  optionsList = "";
  firstSelected = false;
  for (j = 0, len = options.length; j < len; j++) {
    option = options[j];
    if (!firstSelected) {
      optionsList = "\t" + optionsList + "<option value=\"" + option + "\">" + option + "</option>\n";
      firstSelected = true;
    } else {
      optionsList = "\t" + optionsList + "<option value=\"" + option + "\">" + option + "</option>\n";
    }
  }
  optionsList = "<select class=\"prompt-select\" name=\"options-list\" tabindex=\"0\" id=\"options-list\">\n" + optionsList + "</select>";
  htmlContent = "<form action=\"#\" id=\"new-file-form\">\n	<fieldset class=\"ui-helper-reset prompt-fieldset\">\n                <label for=\"file_title\">" + nameMessage + "</label>\n                <input type=\"text\" name=\"file_title\" id=\"file_title\" value=\"" + defaultValue + "\" class=\"ui-widget-content ui-corner-all\">\n		<label for=\"options-list\" class=\"prompt-label module-label\">" + optionsMessage + "</label>\n		" + optionsList + "\n	</fieldset>\n</form>";
  $("#prompt-dialog").html(htmlContent);
  confirmed = false;
  fileTitle = '';
  moduleName = '';
  overwrite = false;
  matchId = null;
  $("#prompt-dialog").dialog({
    resizable: false,
    modal: true,
    title: title,
    height: 200,
    width: 320,
    buttons: {
      'Create': function() {
        var dialogMessage, dialogTitle, thisContainer;
        fileTitle = $('#file_title').val();
        if (fileTitle.trim() === '') {
          return;
        }
        moduleName = $('#options-list').val();
        if (moduleName.trim() === '') {
          return;
        }
        fileTitle = adjustFileSuffix(fileTitle, suffix);
        fileTitle = "" + fileTitle + suffix;
        thisContainer = $(this);
        if (matchId = hasChild(parentNode.id, fileTitle)) {
          dialogTitle = "Overwrite " + fileTitle;
          dialogMessage = "<p><span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:0 7px 20px 0;\"></span>\"" + fileTitle + "\" already exists. Are you sure you want to overwrite it?</p>";
          return confirmationDialog(dialogTitle, dialogMessage, function(accepted) {
            if (accepted) {
              confirmed = true;
              overwrite = true;
              return thisContainer.dialog('close');
            }
          });
        } else {
          confirmed = true;
          return thisContainer.dialog('close');
        }
      },
      'Cancel': function() {
        return $(this).dialog('close');
      }
    },
    close: function() {
      $('#prompt-dialog').html('');
      return cb(confirmed, fileTitle, moduleName, overwrite, matchId);
    }
  });
  keyPressHandler = function(e) {
    var createButton;
    if (e.keyCode === 13) {
      createButton = $('#prompt-dialog').parent().find('.ui-button:contains(\"Select\")');
      createButton.click();
      e.preventDefault();
      return e.stopPropagation();
    }
  };
  $('#prompt-dialog').parent().keypress(keyPressHandler);
  $('#options-list').selectmenu().addClass('prompt-overflow');
  return $('#prompt-dialog').parent().focus();
};
optionsDialog = function(optionsTitle, optionsMessage, options, cb) {
  var confirmed, fileId, fileName, firstSelected, htmlContent, j, keyPressHandler, len, option, optionsList;
  optionsList = "";
  firstSelected = false;
  for (j = 0, len = options.length; j < len; j++) {
    option = options[j];
    if (!firstSelected) {
      optionsList = "\t" + optionsList + "<option value=\"" + option.id + "\">" + option.text + "</option>\n";
      firstSelected = true;
    } else {
      optionsList = "\t" + optionsList + "<option value=\"" + option.id + "\">" + option.text + "</option>\n";
    }
  }
  optionsList = "<select class=\"prompt-select\" name=\"options-list\" tabindex=\"0\" id=\"options-list\">\n" + optionsList + "</select>";
  htmlContent = "<form action=\"#\" id=\"new-file-form\">\n	<fieldset class=\"ui-helper-reset prompt-fieldset\">\n		<label for=\"options-list\" class=\"prompt-label\">" + optionsMessage + "</label>\n		" + optionsList + "\n	</fieldset>\n</form>";
  $('#prompt-dialog').html(htmlContent);
  $('#new-file-form').on('submit', function(e) {
    e.preventDefault();
    return e.stopPropagation();
  });
  confirmed = false;
  fileId = null;
  fileName = '';
  $("#prompt-dialog").dialog({
    resizable: false,
    modal: true,
    title: optionsTitle,
    height: 150,
    width: 280,
    open: function(event, ui) {},
    buttons: {
      'Select': function() {
        var thisContainer;
        fileId = $('#options-list').val();
        if ((fileId == null) || fileId.trim() === '') {
          return;
        }
        fileName = $("#options-list").children("option").filter(":selected").text();
        thisContainer = $(this);
        confirmed = true;
        return thisContainer.dialog('close');
      },
      'Cancel': function() {
        return $(this).dialog('close');
      }
    },
    close: function() {
      $('#prompt-dialog').html('');
      return cb(confirmed, fileId, fileName);
    }
  });
  keyPressHandler = function(e) {
    var createButton;
    if (e.keyCode === 13) {
      createButton = $('#prompt-dialog').parent().find('.ui-button:contains(\"Select\")');
      createButton.click();
      e.preventDefault();
      return e.stopPropagation();
    }
  };
  $('#prompt-dialog').parent().keypress(keyPressHandler);
  $('#options-list').selectmenu().addClass('prompt-overflow');
  return $('#prompt-dialog').parent().focus();
};
newVerilog = function(isContext) {
  var ref, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getParentTargetNode(isContext);
  if ((ref = !targetNode.type) === 'folder' || ref === 'root') {
    return;
  }
  return moduleDialog('Enter module name..', 'Module Name: ', '', targetNode, '.v', function(confirmed, fileName, overwrite, matchId, seq) {
    var fileContent, fileId, fileType, folderId, j, len, module, moduleId, moduleName, modules, newNode;
    if (!confirmed) {
      return;
    }
    loadingOn();
    fileName = adjustFileSuffix(fileName, '.v');
    fileName = fileName + ".v";
    moduleName = fileName;
    if (moduleName.indexOf('.v', moduleName.length - 2) !== -1) {
      moduleName = moduleName.substring(0, moduleName.length - 2);
    }
    if (overwrite) {
      deleteNode(matchId);
    }
    fileId = generateId('verilog');
    folderId = targetNode.id;
    fileContent = '';
    if (!seq) {
      fileContent = "// file: " + fileName + "\n\n`timescale 1ns/1ns\n\nmodule " + moduleName + ";\n\nendmodule";
    } else {
      fileContent = "// file: " + fileName + "\n\n`timescale 1ns/1ns\n\nmodule " + moduleName + "(clk, rst);\n    input clk, rst;\n\n    always @(posedge clk) begin\n        if (!rst) begin\n            //Reset logic goes here.\n        end\n        else begin\n            //Sequential logic goes here.\n        end\n    end\nendmodule";
    }
    fileType = 'verilog';
    newNode = createNode(fileId, folderId, fileName, fileType);
    createAceTab(newNode, fileContent);
    modules = extractModules(fileContent);
    deleteChildren(fileId);
    for (j = 0, len = modules.length; j < len; j++) {
      module = modules[j];
      moduleId = module + "_" + fileName + "_" + module + "_" + ((new Date).valueOf()) + "_" + (('' + Math.random()).split('.')[1]);
      createNode(moduleId, fileId, module, 'module');
    }
    filesContent[fileId] = fileContent;
    return loadingOff();
  });
};
newTestbench = function(isContext) {
  var ref, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getParentTargetNode(isContext);
  if ((ref = !targetNode.type) === 'folder' || ref === 'root') {
    return;
  }
  loadingOn();
  return getVerilogFiles(function(err, modules) {
    loadingOff();
    if (err) {
      return displayError(err);
    } else {
      return optionsDialog('Select Source Module', 'Module File Name: ', modules, function(confirmed, fileId, fileName) {
        var testbenchName;
        if (!confirmed) {
          return;
        }
        fileName = adjustFileSuffix(fileName, '.v');
        testbenchName = fileName + "_tb.v";
        loadingOn();
        return retrieveFile(fileId, function(err, fileContent, fileName, fileType, fileModules) {
          loadingOff();
          if (err) {
            return displayError(err);
          } else {
            if (fileType !== 'verilog' && fileType !== 'exverilog') {
              return;
            }
            return nameAndOptionDialog('Enter testbench name', 'Testbench Name: ', testbenchName, 'Target Module: ', fileModules, targetNode, '.v', function(confirmed, fileTitle, moduleName, overwrite, matchId) {
              var folderId, newNode;
              if (!confirmed) {
                return;
              }
              fileTitle = adjustFileSuffix(fileTitle, '.v');
              testbenchName = fileTitle + ".v";
              loadingOn();
              moduleName = testbenchName;
              if (moduleName.indexOf('.v', moduleName.length - 2) !== -1) {
                moduleName = moduleName.substring(0, moduleName.length - 2);
              }
              if (overwrite) {
                deleteNode(matchId);
              }
              fileName = testbenchName;
              fileId = generateId('testbench');
              folderId = targetNode.id;
              fileContent = "// file: " + fileName + "\n\n`timescale 1ns/1ns\n\nmodule " + moduleName + ";\n\nendmodule";
              filesContent[fileId] = fileId;
              fileType = 'testbench';
              newNode = createNode(fileId, folderId, fileName, fileType);
              createAceTab(newNode, fileContent);
              return loadingOff();
            });
          }
        });
      });
    }
  });
};
newFolder = function(isContext) {
  var ref, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getParentTargetNode(isContext);
  if ((ref = !targetNode.type) === 'folder' || ref === 'root') {
    return;
  }
  return fileDialog('Enter folder name..', 'Folder Name: ', 'Untitled Folder', targetNode, '', function(confirmed, fileName, overwrite, matchId) {
    var fileId, fileType, folderId, newNode;
    if (!confirmed) {
      return;
    }
    loadingOn();
    fileId = generateId('folder');
    folderId = targetNode.id;
    fileType = 'folder';
    if (overwrite) {
      deleteNode(matchId);
    }
    newNode = createNode(fileId, folderId, fileName, fileType);
    selectNode(newNode.id);
    return loadingOff();
  });
};
saveFile = function(fileId, newContent, cb) {
  var fileName, fileNode, fileType, modules;
  fileNode = getNodeById(fileId);
  if (fileNode == null) {
    return cb({
      error: 'Failed to get file node'
    });
  }
  loadingOn();
  fileId = fileNode.id;
  fileName = fileNode.text;
  fileType = fileNode.type;
  filesContent[fileId] = newContent;
  modules = [];
  if (fileType === 'verilog' || fileType === 'exverilog') {
    modules = extractModules(newContent);
  }
  loadingOff();
  if (typeof cb === 'function') {
    return cb(null, fileId, fileName, fileType, newContent, modules);
  }
};
saveOpenTab = function(isContext) {
  var editor, editorTab, fileId, newContent, tabId, waveform, waveformTab;
  if (isContext == null) {
    isContext = false;
  }
  editor = getActiveEditor();
  if (editor) {
    editorTab = editor.tab;
    if (editorTab.data('saved')) {
      return;
    }
    newContent = editor.getValue();
    fileId = editorTab.data('fileId');
    tabId = "tabs-" + fileId;
    return saveFile(fileId, newContent, function(err, fileId, fileName, fileType, newContent, modules) {
      var j, len, module, moduleId;
      if (err) {
        return displayError(err);
      } else {
        if (fileType === 'verilog' || fileType === 'exverilog') {
          deleteChildren(fileId);
          for (j = 0, len = modules.length; j < len; j++) {
            module = modules[j];
            moduleId = module + "_" + fileName + "_" + module + "_" + ((new Date).valueOf()) + "_" + (('' + Math.random()).split('.')[1]);
            createNode(moduleId, fileId, module, 'module');
          }
        }
        editorTab.data('saved', true);
        return setTabTitle(tabId, fileName);
      }
    });
  } else {
    waveform = getActiveWaveform();
    if (waveform) {
      waveformTab = waveform.tab;
      if (waveformTab.data('saved')) {
        return;
      }
      newContent = waveform.exportTimingDiagram();
      fileId = waveformTab.data('fileId');
      tabId = "tabs-" + fileId;
      return saveFile(fileId, newContent, function(err, fileId, fileName, fileType, newContent, modules) {
        if (err) {
          return displayError(err);
        } else {
          waveformTab.data('saved', true);
          return setTabTitle(tabId, fileName);
        }
      });
    }
  }
};
searchClearead = true;
searchFile = function(isContext) {
  if (isContext == null) {
    isContext = false;
  }
  return searchDialog('File Search', 'File Name: ', '', function(confirmed, query) {
    if (!confirmed) {
      return;
    }
    $('#files').jstree(true).search(query);
    return searchClearead = false;
  });
};
undoAction = function(isContext) {
  var editor;
  if (isContext == null) {
    isContext = false;
  }
  editor = getActiveEditor();
  if ((editor != null) && editor) {
    return editor.undo();
  }
};
redoAction = function(isContext) {
  var editor;
  if (isContext == null) {
    isContext = false;
  }
  editor = getActiveEditor();
  if ((editor != null) && editor) {
    return editor.redo();
  }
};
selectAll = function(isContext) {
  var editor;
  if (isContext == null) {
    isContext = false;
  }
  editor = getActiveEditor();
  if ((editor != null) && editor) {
    return editor.selectAll();
  }
};
findAction = function(isContext) {
  var editor;
  if (isContext == null) {
    isContext = false;
  }
  editor = getActiveEditor();
  if ((editor != null) && editor) {
    return editor.execCommand('find');
  }
};
replaceAction = function(isContext) {
  var editor;
  if (isContext == null) {
    isContext = false;
  }
  editor = getActiveEditor();
  if ((editor != null) && editor) {
    return editor.execCommand('replace');
  }
};
copyFile = function(isContext) {
  var ref, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  if (!targetNode || ((ref = !targetNode.type) === 'verilog' || ref === 'exverilog' || ref === 'testbench')) {
    return;
  }
  return $('#files').jstree(true).copy(targetNode);
};
cutFile = function(isContext) {
  var ref, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  if (!targetNode || ((ref = !targetNode.type) === 'verilog' || ref === 'exverilog' || ref === 'testbench')) {
    return;
  }
  return $('#files').jstree(true).cut(targetNode);
};
pasteId = null;
pasteFile = function(isContext) {
  var _operate, buffer, dialogMessage, dialogTitle, matchId, overwrite, ref, source, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  if (!$('#files').jstree(true).can_paste()) {
    return;
  }
  if ((ref = targetNode.type) !== 'folder' && ref !== 'root') {
    return;
  }
  buffer = $('#files').jstree(true).get_buffer();
  source = buffer.node[0];
  overwrite = false;
  matchId = false;
  _operate = function(action) {
    var fileId, fileName, fileType, itemType, parentId;
    fileId = generateId(source.type);
    fileName = source.fileName;
    parentId = targetNode.id;
    fileType = source.type;
    itemType = 'file';
    if (overwrite) {
      deleteNode(matchId);
    }
    $('#files').jstree(true).paste(targetNode);
    if (action === 'copy') {
      addToFileTree(fileId, parentId, fileName, fileType);
      filesContent[fileId] = filesContent[source.id];
    } else if (action === 'move') {
      updateTreeFileParent(source.id, parentId);
    }
    loadingOff();
    if (pasteId !== fileId) {
      setNodeId(pasteId, fileId);
    }
    if (!isNodeOpen(targetNode)) {
      openNode(targetNode.id);
    }
    return selectNode(fileId);
  };
  if (buffer.mode === 'copy_node') {
    if (matchId = hasChild(targetNode.id, buffer.node[0].text)) {
      dialogTitle = "Overwrite " + buffer.node[0].text;
      dialogMessage = "<p><span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:0 7px 20px 0;\"></span>\"" + buffer.node[0].text + "\" already exists. Are you sure you want to overwrite it?</p>";
      return confirmationDialog(dialogTitle, dialogMessage, function(confirmed) {
        if (confirmed) {
          overwrite = true;
          loadingOn();
          return _operate('copy');
        }
      });
    } else {
      loadingOn();
      return _operate('copy');
    }
  } else if (buffer.mode === 'move_node') {
    if (matchId = hasChild(targetNode.id, buffer.node[0].text)) {
      dialogTitle = "Overwrite " + buffer.node[0].text;
      dialogMessage = "<p><span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:0 7px 20px 0;\"></span>\"" + buffer.node[0].text + "\" already exists. Are you sure you want to overwrite it?</p>";
      return confirmationDialog(dialogTitle, dialogMessage, function(confirmed) {
        if (confirmed) {
          overwrite = true;
          loadingOn();
          return _operate('move');
        }
      });
    } else {
      loadingOn();
      return _operate('move');
    }
  }
};
includeInBuild = function(isContext) {
  var targetId, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  if (!targetNode || targetNode.type !== 'exverilog') {
    return;
  }
  targetId = targetNode.id;
  loadingOn();
  updateTreeFileType(targetId, 'verilog');
  $('#files').jstree(true).set_type(targetNode, 'verilog');
  return loadingOff();
};
excludeFromBuild = function(isContext) {
  var targetId, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  if (!targetNode || targetNode.type !== 'verilog') {
    return;
  }
  targetId = targetNode.id;
  loadingOn();
  updateTreeFileType(targetId, 'exverilog');
  $('#files').jstree(true).set_type(targetNode, 'exverilog');
  return loadingOff();
};
renameFile = function(isContext) {
  var _rollback, fileId, oldName, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  if (targetNode.type === 'root') {
    return displayError('Cannot rename repository root.');
  }
  if (targetNode.type === 'buildFolder') {
    return displayError('Cannot rename read-only directory.');
  }
  fileId = targetNode.id;
  oldName = targetNode.text;
  _rollback = function() {
    return renameNode(updatedNode, oldName);
  };
  return $('#files').jstree(true).edit(targetNode, null, function(updatedNode, success, cancelled) {
    var newName, saved, tab, tabId, tabTitle;
    if (cancelled) {
      return;
    }
    if (!success) {
      return displayError('A file with the same name already exists.');
    } else {
      loadingOn();
      fileId = updatedNode.id;
      newName = updatedNode.text;
      updateTreeFileName(fileId, newName);
      tabId = "tabs-" + fileId;
      tab = $("#" + tabId);
      if (tab.length) {
        saved = tab.data('saved');
        tabTitle = newName;
        if ((saved != null) && !saved) {
          tabTitle = tabTitle + ' *';
        }
        setTabTitle(tabId, tabTitle);
      }
      return loadingOff();
    }
  });
};
deleteFile = function(isContext) {
  var dialogMessage, dialogTitle, fileName, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  if (targetNode.type === 'root') {
    return displayError('Cannot delete repository root.');
  }
  if (targetNode.type === 'buildFolder') {
    return displayError('Cannot delete read-only directory.');
  }
  fileName = targetNode.text;
  dialogTitle = "Delete " + targetNode.text;
  dialogMessage = "<p><span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:0 7px 20px 0;\"></span>Are you sure you want to delete \"" + targetNode.text + "\"?</p>";
  return confirmationDialog(dialogTitle, dialogMessage, function(confirmed) {
    var fileId;
    if (confirmed) {
      if (targetNode) {
        loadingOn();
        fileId = targetNode.id;
        deleteTreeFileType(fileId);
        deleteNode(fileId);
        filesContent[fileId] = void 0;
        loadingOff();
        return displayMessage(fileName + " was deleted successfully.");
      }
    }
  });
};
duplicateFile = function(isContext) {
  var dialogMessage, dialogTitle, ref, targetId, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  if ((ref = targetNode.type) === 'folder' || ref === 'buildFolder' || ref === 'root' || ref === 'module') {
    return;
  }
  targetId = targetNode.id;
  dialogTitle = "Duplicate " + targetNode.text;
  dialogMessage = "<p>Are you sure you want to duplicate \"" + targetNode.text + "\"?</p>";
  return confirmationDialog(dialogTitle, dialogMessage, function(confirmed) {
    var baseName, duplicateName, duplicateNameRegex, extRegEx, extension, fileId, fileName, fileType, instanceNumber, matchId, matches, parentId, ref1;
    if (confirmed) {
      fileName = targetNode.text;
      duplicateName = void 0;
      extRegEx = /(.+)\.([0-9a-z]+)$/i;
      if (((ref1 = targetNode.type) === 'verilog' || ref1 === 'exverilog' || ref1 === 'testbench') && extRegEx.test(fileName)) {
        matches = extRegEx.exec(fileName);
        baseName = matches[1];
        extension = matches[2];
        duplicateNameRegex = /(.+)_\d+ *$/;
        if (duplicateNameRegex.test(baseName)) {
          baseName = duplicateNameRegex.exec(baseName)[1];
        }
        if (!(matchId = hasChild(targetNode.parent, baseName + '.' + extension))) {
          duplicateName = baseName + '.' + extension;
        } else {
          duplicateName = baseName + '_2' + '.' + extension;
          instanceNumber = 3;
          while (hasChild(targetNode.parent, duplicateName)) {
            duplicateName = baseName + '_' + instanceNumber + '.' + extension;
            instanceNumber++;
          }
        }
      } else if (targetNode.type === 'folder') {
        duplicateNameRegex = /(.+)_\d+ *$/;
        if (duplicateNameRegex.test(fileName)) {
          fileName = duplicateNameRegex.exec(fileName)[1];
        }
        if (!hasChild(targetNode.parent, fileName)) {
          duplicateName = fileName;
        } else {
          duplicateName = fileName + '_2';
          instanceNumber = 3;
          while (hasChild(targetNode.parent, duplicateName)) {
            duplicateName = fileName + '_' + instanceNumber;
            instanceNumber++;
          }
        }
      } else {
        return displayError({
          error: 'Cannot duplicate the selected file type.'
        });
      }
      fileId = generateId(targetNode.type);
      fileName = duplicateName;
      parentId = targetNode.parent;
      fileType = targetNode.type;
      createNode(fileId, parentId, fileName, fileType, getNodeIndex(targetId) + 1);
      filesContent[fileId] = filesContent[targetNode.id];
      addToFileTree(fileId, parentId, duplicateName, targetNode.type);
      return selectNode(fileId);
    }
  });
};
synthesize = function(isContext) {
  if (isContext == null) {
    isContext = false;
  }
  if (!((topModule != null) && topModuleFileId)) {
    return displayError('You must set top module first.');
  }
  return saveAll(false, function(err, cancelled) {
    if (cancelled) {
      return;
    }
    if (err) {
      return displayError(err);
    } else {
      return getStandardCells(function(err, stdcells) {
        if (err) {
          return displayError(err);
        } else {
          return synthesisDialog(stdcells, function(confirmed, fileName, stdcell, options, overwrite, matchId) {
            var file, j, len, requestBody;
            if (!confirmed) {
              return;
            }
            fileName = adjustFileSuffix(fileName, '.v');
            fileName = fileName + ".v";
            loadingOn();
            requestBody = {
              files: [],
              stdcell: stdcell,
              options: options,
              name: fileName,
              topModule: topModule,
              topModuleFileId: topModuleFileId
            };
            for (j = 0, len = filesTree.length; j < len; j++) {
              file = filesTree[j];
              if (file.type === 'verilog') {
                requestBody.files.push({
                  id: file.id,
                  name: file.text,
                  content: filesContent[file.id]
                });
              }
            }
            return request(Urls.compile, 'POST', requestBody, (function(res) {
              var errors, fileId, fileType, newNode, parentId, report, synthContent, warnings;
              clearAllGrids();
              loadingOff();
              fileId = generateId('netlist');
              fileType = 'netlist';
              parentId = buildFolderId;
              synthContent = res.netlist || '';
              errors = res.log.errors || [];
              warnings = res.log.warnings || [];
              report = res.log.report || '';
              if (typeof report === 'string') {
                report.split('\n').forEach(function(reportLine) {
                  if (reportLine.trim() !== '') {
                    return logInfo({
                      message: reportLine
                    });
                  }
                });
                setLogTab(0);
              }
              if (warnings.length > 0) {
                warnings.forEach(function(warn) {
                  return logWarning(warn);
                });
                setLogTab(2);
              }
              loadingOff();
              if (errors.length === 0) {
                deleteNode(fileId);
                if (warnings.length === 0) {
                  displayInfo('Synthesis completed successfully.');
                } else {
                  displayInfo('Synthesis completed with warnings.');
                }
                if (overwrite) {
                  deleteNode(matchId);
                }
                addToFileTree(fileId, parentId, fileName, fileType);
                newNode = createNode(fileId, parentId, fileName, fileType);
                createAceTab(newNode, synthContent);
                return selectNode(fileId);
              } else {
                errors.forEach(function(err) {
                  return logError(err);
                });
                return setLogTab(1);
              }
            }), function(err) {
              loadingOff();
              return displayError(err);
            });
          });
        }
      });
    }
  });
};
simulate = function(isContext) {
  var ref, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  if ((ref = targetNode.type) !== 'testbench' && ref !== 'vcd') {
    return;
  }
  return saveAll(false, function(err, cancelled) {
    var defaultName, targetId;
    if (cancelled) {
      return;
    }
    if (err) {
      return displayError(err);
    } else {
      defaultName = 'simulation.vcd';
      targetId = targetNode.id;
      if (targetNode.type === 'vcd') {
        defaultName = targetNode.text;
      }
      return fileDialog('Enter simulation name..', 'VCD File Name: ', defaultName, getBuildFolderNode(), '.vcd', function(confirmed, fileName, overwrite, matchId) {
        var file, j, len, requestBody;
        if (!confirmed) {
          return;
        }
        fileName = adjustFileSuffix(fileName, '.vcd');
        fileName = fileName + ".vcd";
        requestBody = {
          files: [],
          name: fileName,
          testbenchId: targetId
        };
        for (j = 0, len = filesTree.length; j < len; j++) {
          file = filesTree[j];
          if (file.type === 'verilog') {
            requestBody.files.push({
              id: file.id,
              name: file.text,
              content: filesContent[file.id]
            });
          }
        }
        requestBody.files.push({
          id: targetId,
          name: targetNode.text,
          content: filesContent[targetId]
        });
        loadingOn();
        return request(Urls.simulate, 'POST', requestBody, (function(res) {
          var errors, fileContent, fileId, fileType, log, parentId, warnings;
          clearAllGrids();
          log = res.log.filter(function(msg) {
            return typeof msg === 'string' && msg.trim() !== '';
          });
          errors = res.errors.filter(function(msg) {
            return typeof msg === 'object' && msg.message.trim() !== '';
          });
          warnings = res.warnings.filter(function(msg) {
            return typeof msg === 'object' && msg.message.trim() !== '';
          });
          fileId = generateId('vcd');
          fileType = 'vcd';
          fileContent = res.wave;
          parentId = buildFolderId;
          if (log.length > 0) {
            log.forEach(function(logMessage) {
              return logInfo({
                message: logMessage
              });
            });
            setLogTab(0);
          }
          if (warnings.length > 0) {
            warnings.forEach(function(warn) {
              return logWarning(warn);
            });
            setLogTab(2);
          }
          if (errors.length === 0) {
            if (fileId == null) {
              loadingOff();
              return displayError('Fatal error has occured during simulation.');
            }
            deleteNode(fileId);
            if (warnings.length === 0) {
              displayMessage('Simulation completed successfully.');
            } else {
              displayMessage('Simulation completed with warnings.');
            }
            createNode(fileId, parentId, fileName, fileType);
            addToFileTree(fileId, parentId, fileName, fileType);
            filesContent[fileId] = fileContent;
            openFileById(fileId);
          } else {
            errors.forEach(function(err) {
              return logError(err);
            });
            setLogTab(1);
          }
          return loadingOff();
        }), function(err) {
          displayError(err);
          return loadingOff();
        });
      });
    }
  });
};
workspaceSettings = function() {
  return getProjectSettings(function(err, settings) {
    if (err) {
      loadingOff();
      if (typeof cb === 'function') {
        return cb(err);
      } else {
        return displayError(err);
      }
    } else {
      return workspaceSettingsDialog(settings.theme, settings.fontSize, function(confirmed, themeIndex, fontSize, defaultSettings) {
        var notSavedTabs, tabs;
        if (confirmed) {
          tabs = getAllTabs();
          notSavedTabs = [];
          defaultThemeIndex = themeIndex;
          defaultFontSize = fontSize;
          tabs.forEach(function(tabId) {
            var editor;
            editor = $("#" + tabId).data('editor');
            if (editor) {
              editor.setFontSize(fontSize);
              if (themeIndex === 1) {
                return editor.setTheme('ace/theme/crimson_editor');
              } else {
                return editor.setTheme('ace/theme/twilight');
              }
            }
          });
          return displayMessage('Settings updated successfully.');
        }
      });
    }
  });
};
about = function(isContext) {
  var dialogMessage, dialogTitle, height, width;
  if (isContext == null) {
    isContext = false;
  }
  dialogTitle = "About Cloud V";
  dialogMessage = "<p>This playground is based on the classic version of Cloud V. Find the latest on Cloud V platform and research projects <a href=\"https://cloudv.io\">on our website</a> or <a href=\"https://github.com/Cloud-V\">on our GitHub page</a>.</p>";
  width = 350;
  height = 180;
  return dialogBox(dialogTitle, dialogMessage, width, height);
};
retrieveFile = function(fileId, cb) {
  var fileContent, fileName, fileNode, fileType, modules;
  fileNode = getNodeById(fileId);
  if (fileNode == null) {
    return cb({
      error: 'Failed to get file node'
    });
  }
  fileContent = filesContent[fileId];
  fileName = fileNode.text;
  fileType = fileNode.type;
  modules = [];
  if (fileType === 'verilog' || fileType === 'exverilog') {
    modules = extractModules(fileContent);
  }
  return cb(null, fileContent, fileName, fileType, modules);
};
openFileById = function(fileNode, cb) {
  var fileId, tabId;
  if (typeof fileNode === 'string') {
    fileNode = getNodeById(fileNode);
  }
  fileId = fileNode.id;
  tabId = "tabs-" + fileId;
  if (getTabById(tabId)) {
    setActiveEditorTabById(tabId);
    if (typeof cb === 'function') {
      cb(null);
    }
  } else {
    loadingOn();
    retrieveFile(fileNode.id, function(err, fileContent, fileName, fileType, modules) {
      var j, len, module, moduleId;
      if (err) {
        loadingOff();
        if (typeof cb === 'function') {
          return cb(err);
        } else {
          return displayError(err);
        }
      } else {
        console.log(fileContent);
        console.log(filesContent);
        if (fileType === 'verilog' || fileType === 'exverilog') {
          deleteChildren(fileId);
          for (j = 0, len = modules.length; j < len; j++) {
            module = modules[j];
            moduleId = module + "_" + fileName + "_" + module + "_" + ((new Date).valueOf()) + "_" + (('' + Math.random()).split('.')[1]);
            createNode(moduleId, fileId, module, 'module');
          }
        }
        if (fileType === 'verilog' || fileType === 'testbench' || fileType === 'netlist' || fileType === 'exverilog') {
          createAceTab(fileNode, fileContent);
        } else if (fileType === 'vcd') {
          createWaveformTab(fileNode, fileContent);
        }
        loadingOff();
        selectNode(fileNode.id);
        if (typeof cb === 'function') {
          return cb(null);
        }
      }
    });
  }
  return openNode(fileId);
};
openFile = function(isContext, cb) {
  var ref, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  if (!((targetNode != null) && targetNode)) {
    return;
  }
  if ((ref = targetNode.type) !== 'verilog' && ref !== 'testbench' && ref !== 'netlist' && ref !== 'vcd' && ref !== 'exverilog') {
    return;
  }
  console.log(targetNode);
  return openFileById(targetNode, cb);
};
closeFile = function(isContext) {
  var editor, fileId, tab, tabId, targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  tabId = "tabs-" + targetNode.id;
  tab = $("#" + tabId);
  if (tab.length) {
    editor = tab.data('editor');
    if (editor) {
      fileId = tab.data('fileId');
      return closeTab(tabId);
    }
  }
};
setTopModule = function(isContext, cb) {
  var targetNode;
  if (isContext == null) {
    isContext = false;
  }
  targetNode = getTargetNode(isContext);
  if (targetNode.type !== 'module') {
    return;
  }
  loadingOn();
  topModuleFileId = targetNode.parent;
  topModule = targetNode.text;
  loadingOff();
  if (typeof cb === 'function') {
    return cb(null);
  } else {
    return displayMessage(topModule + " was set as top project module.");
  }
};
$('#toolbar-synthesize').button({
  icons: {
    primary: 'ui-icon-refresh'
  }
}).click(function(e) {
  return synthesize();
});
$('#toolbar-simulate').button({
  icons: {
    primary: 'ui-icon-play'
  }
}).click(function(e) {
  return simulate();
});
toolbar = $('.toolbar');
menubar = $('.menubar');
refreshMenus = function(e) {
  var currentEditor, currentWaveform, nodeType, parentNode, selectedNode;
  enableMenuItem('new');
  enableMenuItem('new-verilog');
  enableMenuItem('new-testbench');
  enableMenuItem('new-folder');
  enableMenuItem('save');
  enableMenuItem('search');
  enableMenuItem('exit');
  enableMenuItem('undo');
  enableMenuItem('redo');
  enableMenuItem('select-all');
  enableMenuItem('find');
  enableMenuItem('replace');
  enableMenuItem('refresh');
  enableMenuItem('copy');
  enableMenuItem('cut');
  enableMenuItem('paste');
  enableMenuItem('rename');
  enableMenuItem('delete');
  enableMenuItem('duplicate');
  enableMenuItem('synthesize');
  enableMenuItem('simulate');
  enableMenuItem('about');
  currentEditor = getActiveEditor();
  currentWaveform = getActiveWaveform();
  if (!(((currentEditor != null) && currentEditor) || ((currentWaveform != null) && currentWaveform))) {
    disableMenuItem('save');
    disableMenuItem('undo');
    disableMenuItem('redo');
    disableMenuItem('select-all');
    disableMenuItem('find');
    disableMenuItem('replace');
  } else if (currentEditor.$readOnly) {
    disableMenuItem('save');
    disableMenuItem('undo');
    disableMenuItem('redo');
    disableMenuItem('replace');
  }
  selectedNode = getSelectedNode();
  if (!selectedNode) {
    disableMenuItem('new');
    disableMenuItem('new-verilog');
    disableMenuItem('new-testbench');
    disableMenuItem('new-folder');
    disableMenuItem('copy');
    disableMenuItem('cut');
    disableMenuItem('paste');
    disableMenuItem('rename');
    disableMenuItem('delete');
    disableMenuItem('duplicate');
    disableMenuItem('simulate');
    return;
  }
  nodeType = selectedNode.type;
  parentNode = getNodeById(selectedNode.parent);
  if (parentNode.type === 'buildFolder') {
    disableMenuItem('copy');
    disableMenuItem('cut');
    disableMenuItem('duplicate');
  }
  if (nodeType === 'buildFolder') {
    disableMenuItem('copy');
    disableMenuItem('cut');
    disableMenuItem('rename');
    disableMenuItem('new');
    disableMenuItem('new-verilog');
    disableMenuItem('new-testbench');
    disableMenuItem('new-folder');
  }
  if (!$('#files').jstree(true).can_paste() || nodeType === 'buildFolder') {
    disableMenuItem('paste');
  }
  if (nodeType === 'folder' || nodeType === 'root' || nodeType === 'buildFolder') {
    return disableMenuItem('duplicate');
  } else if (nodeType === 'module') {
    disableMenuItem('new');
    disableMenuItem('new-verilog');
    disableMenuItem('new-testbench');
    disableMenuItem('new-folder');
    disableMenuItem('copy');
    disableMenuItem('cut');
    disableMenuItem('paste');
    disableMenuItem('rename');
    disableMenuItem('delete');
    return disableMenuItem('duplicate');
  } else {
    disableMenuItem('paste');
    disableMenuItem('new');
    disableMenuItem('new-verilog');
    disableMenuItem('new-testbench');
    return disableMenuItem('new-folder');
  }
};
$('.menubar-topmenu').mouseenter(refreshMenus);
menuItems = $('.menubar-item');
menuItems.each(function(ind, item) {
  var thisItem;
  thisItem = $(item);
  return thisItem.click(function(e) {
    var isDisabled, itemId;
    itemId = thisItem.attr('id');
    $('.menubar-topitem').css('display', 'none');
    isDisabled = thisItem.hasClass('disabled-menu-item');
    if (isDisabled) {
      return;
    }
    switch (itemId) {
      case 'menu-new-verilog':
        return newVerilog();
      case 'menu-new-testbench':
        return newTestbench();
      case 'menu-new-folder':
        return newFolder();
      case 'menu-save':
        return saveOpenTab();
      case 'menu-search':
        return searchFile();
      case 'menu-exit':
        return exitWorkspace();
      case 'menu-undo':
        return undoAction();
      case 'menu-redo':
        return redoAction();
      case 'menu-select-all':
        return selectAll();
      case 'menu-find':
        return findAction();
      case 'menu-replace':
        return replaceAction();
      case 'menu-copy':
        return copyFile();
      case 'menu-move':
        return cutFile();
      case 'menu-cut':
        return cutFile();
      case 'menu-paste':
        return pasteFile();
      case 'menu-rename':
        return renameFile();
      case 'menu-delete':
        return deleteFile();
      case 'menu-duplicate':
        return duplicateFile();
      case 'menu-synthesize':
        return synthesize();
      case 'menu-simulate':
        return simulate();
      case 'menu-settings':
        return workspaceSettings();
      case 'menu-about':
        return about();
    }
  });
});
$('#log-tabs').tabs({
  active: 0
});
$('#files').jstree({
  plugins: ['wholerow', 'types', 'unique', 'search'],
  search: {
    close_opened_onclear: false,
    fuzzy: true
  },
  types: {
    "default": {
      icon: '/images/tree-icons/Blank.png'
    },
    '#': {
      icon: '/images/tree-icons/Folder.png',
      valid_children: ['root']
    },
    root: {
      icon: '/images/tree-icons/Folder.png',
      valid_children: ['folder', 'verilog', 'exverilog', 'testbench']
    },
    buildFolder: {
      icon: '/images/tree-icons/Folder.png',
      valid_children: ['netlist', 'vcd']
    },
    folder: {
      icon: '/images/tree-icons/Folder.png',
      valid_children: ['folder', 'verilog', 'exverilog', 'testbench']
    },
    verilog: {
      icon: '/images/tree-icons/Verilog.png',
      valid_children: ['module']
    },
    exverilog: {
      icon: '/images/tree-icons/XVerilog.png',
      valid_children: ['module']
    },
    testbench: {
      icon: '/images/tree-icons/TB.png',
      valid_children: []
    },
    netlist: {
      icon: '/images/tree-icons/NTL.png',
      valid_children: []
    },
    vcd: {
      icon: '/images/tree-icons/VCD.png',
      valid_children: []
    },
    module: {
      icon: '/images/tree-icons/MOD2.png',
      valid_children: []
    }
  },
  contextmenu: {
    items: function($node) {
      return {
        Create: {
          label: 'Create New',
          icon: false,
          action: function(obj) {
            return this.create(obj);
          }
        }
      };
    }
  },
  core: {
    themes: {
      name: 'default-dark',
      dots: false
    },
    multiple: false,
    check_callback: function(operation, node, nodeParent, node_position, more) {
      var ref, ref1;
      return true;
      if (operation === 'move_node') {
        if ((ref = nodeParent.type) !== 'folder' && ref !== 'root') {
          return false;
        }
      } else if (operation === 'copy_node') {
        if ((ref1 = nodeParent.type) !== 'folder' && ref1 !== 'root') {
          return false;
        }
      } else {
        return true;
      }
    },
    data: []
  }
}).on('contextmenu', '.jstree-anchor', (function(e) {
  var node;
  node = $(e.target).closest("li");
  if (node.length) {
    return contextId = node.attr('id');
  }
})).bind('hover_node.jstree', (function(e, data) {
  return highlightedId = data.node.id;
})).bind('dehover_node.jstree', (function(e, data) {
  return highlightedId = null;
})).bind('dblclick.jstree', (function(e) {
  var node, nodeId;
  node = $(e.target).closest("li");
  if (node.length) {
    nodeId = node.attr('id');
    if ((nodeId != null) && nodeId.trim() !== '') {
      return openFile();
    }
  }
})).bind('paste.jstree', (function() {})).bind('copy_node.jstree', (function(e, data) {
  return pasteId = data.node.id;
})).bind('move_node.jstree', (function(e, data) {
  return pasteId = data.node.id;
})).bind('select_node.jstree', (function(e, data) {
  if (!searchClearead) {
    $('#files').jstree(true).search('');
    return searchClearead = true;
  }
})).bind('keypress', (function(e, data) {
  if (e.keyCode === 127) {
    return deleteFile(false);
  }
}));
setTreeData = function(treeData) {
  $('#files').jstree(true).settings.core.data = treeData;
  return $('#files').jstree(true).refresh();
};
promptCopy = function(text) {
  return window.prompt('Copy to clipboard: Ctrl/Command + C, Enter', text);
};
$('#console').contextmenu({
  menu: [
    {
      title: 'Clear',
      cmd: 'clear'
    }, {
      title: 'Copy',
      cmd: 'copy'
    }
  ],
  close: function(event) {},
  beforeOpen: function(event, ui) {
    var target;
    target = $(ui.target);
    if (target.is('li') && target.hasClass('ui-widget-content')) {
      return $('#console').contextmenu('enableEntry', 'copy', true);
    } else {
      return $('#console').contextmenu('enableEntry', 'copy', false);
    }
  },
  select: function(event, ui) {
    var target;
    if (ui.cmd === 'clear') {
      return clearInfoLogs();
    } else if (ui.cmd === 'copy') {
      target = $(ui.target);
      return promptCopy(target.html());
    }
  }
});
$('#errors').contextmenu({
  menu: [
    {
      title: 'Clear',
      cmd: 'clear'
    }, {
      title: 'Copy',
      cmd: 'copy'
    }
  ],
  close: function(event) {},
  beforeOpen: function(event, ui) {
    var target;
    target = $(ui.target);
    if (target.is('li') && target.hasClass('ui-widget-content')) {
      return $('#errors').contextmenu('enableEntry', 'copy', true);
    } else {
      return $('#errors').contextmenu('enableEntry', 'copy', false);
    }
  },
  select: function(event, ui) {
    var target;
    if (ui.cmd === 'clear') {
      return clearErrorLogs();
    } else if (ui.cmd === 'copy') {
      target = $(ui.target);
      return promptCopy(target.html());
    }
  }
});
$('#warnings').contextmenu({
  menu: [
    {
      title: 'Clear',
      cmd: 'clear'
    }, {
      title: 'Copy',
      cmd: 'copy'
    }
  ],
  close: function(event) {},
  beforeOpen: function(event, ui) {
    var target;
    target = $(ui.target);
    if (target.is('li') && target.hasClass('ui-widget-content')) {
      return $('#warnings').contextmenu('enableEntry', 'copy', true);
    } else {
      return $('#warnings').contextmenu('enableEntry', 'copy', false);
    }
  },
  select: function(event, ui) {
    var target;
    if (ui.cmd === 'clear') {
      return clearWarningLogs();
    } else if (ui.cmd === 'copy') {
      target = $(ui.target);
      return promptCopy(target.html());
    }
  }
});
addTreeContextMenu = function() {
  return $('#files').contextmenu({
    delegate: '.tree-item',
    menu: [
      {
        title: 'Set As Top Module',
        cmd: 'settop'
      }, {
        title: 'New',
        cmd: 'new',
        children: [
          {
            title: 'Verilog Module',
            cmd: 'newverilog'
          }, {
            title: 'Verilog Testbench',
            cmd: 'newtestbench'
          }
        ]
      }, {
        title: 'New Folder',
        cmd: 'newfolder'
      }, {
        title: 'Open',
        cmd: 'open'
      }, {
        title: '----',
        cmd: 'first-seperator'
      }, {
        title: 'Copy',
        cmd: 'copy'
      }, {
        title: 'Cut',
        cmd: 'cut'
      }, {
        title: 'Paste',
        cmd: 'paste'
      }, {
        title: 'Rename',
        cmd: 'rename'
      }, {
        title: 'Delete',
        cmd: 'delete'
      }, {
        title: '----',
        cmd: 'second-seperator'
      }, {
        title: 'Duplicate',
        cmd: 'duplicate'
      }, {
        title: '----',
        cmd: 'third-seperator'
      }, {
        title: 'Exclude from Build',
        cmd: 'exclude'
      }, {
        title: 'Include in Build',
        cmd: 'include'
      }, {
        title: 'Close',
        cmd: 'close'
      }
    ],
    beforeOpen: function(event, ui) {
      var contextNode, nodeType, parentNode;
      contextNode = $('#files').jstree(true).get_node(contextId);
      nodeType = contextNode.type;
      $('#files').contextmenu('showEntry', 'settop', true);
      $('#files').contextmenu('showEntry', 'new', true);
      $('#files').contextmenu('showEntry', 'newfolder', true);
      $('#files').contextmenu('showEntry', 'open', true);
      $('#files').contextmenu('showEntry', 'first-seperator', true);
      $('#files').contextmenu('showEntry', 'copy', true);
      $('#files').contextmenu('showEntry', 'cut', true);
      $('#files').contextmenu('showEntry', 'paste', true);
      $('#files').contextmenu('showEntry', 'rename', true);
      $('#files').contextmenu('showEntry', 'delete', true);
      $('#files').contextmenu('showEntry', 'second-seperator', true);
      $('#files').contextmenu('showEntry', 'duplicate', true);
      $('#files').contextmenu('showEntry', 'third-seperator', true);
      $('#files').contextmenu('showEntry', 'exclude', true);
      $('#files').contextmenu('showEntry', 'include', true);
      $('#files').contextmenu('showEntry', 'close', true);
      $('#files').contextmenu('enableEntry', 'copy', true);
      $('#files').contextmenu('enableEntry', 'cut', true);
      $('#files').contextmenu('enableEntry', 'paste', true);
      $('#files').contextmenu('enableEntry', 'duplicate', true);
      $('#files').contextmenu('enableEntry', 'new', true);
      $('#files').contextmenu('enableEntry', 'newfolder', true);
      parentNode = getNodeById(contextNode.parent);
      if (parentNode.type === 'buildFolder') {
        $('#files').contextmenu('enableEntry', 'copy', false);
        $('#files').contextmenu('enableEntry', 'cut', false);
        $('#files').contextmenu('enableEntry', 'duplicate', false);
      }
      if (nodeType === 'buildFolder') {
        $('#files').contextmenu('showEntry', 'copy', false);
        $('#files').contextmenu('showEntry', 'cut', false);
        $('#files').contextmenu('showEntry', 'rename', false);
        $('#files').contextmenu('showEntry', 'delete', false);
        $('#files').contextmenu('enableEntry', 'new', false);
        $('#files').contextmenu('enableEntry', 'newfolder', false);
      }
      if (!$('#files').jstree(true).can_paste() || nodeType === 'buildFolder') {
        $('#files').contextmenu('enableEntry', 'paste', false);
      }
      if (nodeType !== 'verilog') {
        $('#files').contextmenu('showEntry', 'exclude', false);
      }
      if (nodeType !== 'exverilog') {
        $('#files').contextmenu('showEntry', 'include', false);
      }
      if (nodeType === 'folder' || nodeType === 'root' || nodeType === 'buildFolder') {
        $('#files').contextmenu('showEntry', 'settop', false);
        $('#files').contextmenu('showEntry', 'open', false);
        $('#files').contextmenu('showEntry', 'second-seperator', false);
        $('#files').contextmenu('showEntry', 'duplicate', false);
        $('#files').contextmenu('showEntry', 'third-seperator', false);
        return $('#files').contextmenu('showEntry', 'close', false);
      } else if (nodeType === 'module') {
        $('#files').contextmenu('showEntry', 'new', false);
        $('#files').contextmenu('showEntry', 'newfolder', false);
        $('#files').contextmenu('showEntry', 'open', false);
        $('#files').contextmenu('showEntry', 'first-seperator', false);
        $('#files').contextmenu('showEntry', 'copy', false);
        $('#files').contextmenu('showEntry', 'cut', false);
        $('#files').contextmenu('showEntry', 'paste', false);
        $('#files').contextmenu('showEntry', 'rename', false);
        $('#files').contextmenu('showEntry', 'delete', false);
        $('#files').contextmenu('showEntry', 'second-seperator', false);
        $('#files').contextmenu('showEntry', 'duplicate', false);
        $('#files').contextmenu('showEntry', 'third-seperator', false);
        return $('#files').contextmenu('showEntry', 'close', false);
      } else {
        $('#files').contextmenu('showEntry', 'paste', false);
        $('#files').contextmenu('showEntry', 'settop', false);
        $('#files').contextmenu('showEntry', 'new', false);
        return $('#files').contextmenu('showEntry', 'newfolder', false);
      }
    },
    close: function(event) {},
    select: function(event, ui) {
      var selectedItem;
      selectedItem = $('#files').jstree('get_selected');
      if (contextId != null) {
        switch (ui.cmd) {
          case 'newverilog':
            return newVerilog(true);
          case 'newtestbench':
            return newTestbench(true);
          case 'newfolder':
            return newFolder(true);
          case 'open':
            return openFile(true);
          case 'copy':
            return copyFile(true);
          case 'cut':
            return cutFile(true);
          case 'paste':
            return pasteFile(true);
          case 'rename':
            return renameFile(true);
          case 'delete':
            return deleteFile(true);
          case 'duplicate':
            return duplicateFile(true);
          case 'exclude':
            return excludeFromBuild(true);
          case 'include':
            return includeInBuild(true);
          case 'close':
            return closeFile(true);
          case 'settop':
            return setTopModule(true);
        }
      }
    }
  });
};
editorTabs = $('#editor-tabs').tabs({
  active: 0,
  heightStyle: 'fill',
  activate: function(ui, event) {
    var editor, fileId;
    fileId = $('#' + getActiveEditorTabId()).data('fileId');
    if (fileId) {
      selectNode(fileId);
    }
    editor = getActiveEditor();
    if (editor) {
      return editor.focus();
    }
  }
});
editorTabs.find(".ui-tabs-nav").sortable({
  axis: 'x',
  distance: 5,
  stop: function() {
    return editorTabs.tabs("refresh");
  }
});
$('#editor-tabs').tabs().delegate('span.ui-icon-close.ui-icon-close-tab', 'click', function() {
  var tabId;
  tabId = $(this).closest('li').attr('aria-controls');
  if ((tabId != null) && tabId.trim() !== '') {
    return closeTab(tabId);
  }
});
$('#editor-tabs').tabs().keypress(function(event) {});
tabCounter = 0;
tabTemplate = "<li><a class=\"editor-tab-link\" href='#\{href}'>#\{title}</a> <span class='ui-icon ui-icon-close ui-icon-close-tab' role='presentation'>Remove Tab</span></li>";
addEditorTab = function(title, fileId) {
  var id, li;
  id = 'tabs-' + fileId;
  if (getTabById(id)) {
    setActiveEditorTabById(id);
  } else {
    li = $(tabTemplate.replace(/#\{href\}/g, '#' + id).replace(/#\{title\}/g, title));
    li.on('mouseup', function(e) {
      if (e.which === 2) {
        closeTab(id);
        return false;
      } else {
        return true;
      }
    });
    $('#editor-tabs').tabs().find('.ui-tabs-nav').append(li);
    $('#editor-tabs').tabs().append("<div id=\"" + id + "\" class=\"editor-tab-content\"></div>");
    $('#editor-tabs').tabs().tabs('refresh');
    setActiveEditorTabById(id);
  }
  return id;
};
setTabTitle = function(tabId, newTitle) {
  var tabLink;
  tabLink = $("[href=\"#" + tabId + "\"].editor-tab-link.ui-tabs-anchor");
  if (tabLink.length) {
    tabLink.text(newTitle);
    return true;
  }
  return false;
};
attachEditor = function(tabId, file, defaultValue) {
  var blockScrolling, editor, editorId, editorTab, ref;
  if (defaultValue == null) {
    defaultValue = '';
  }
  editorTab = $("#" + tabId);
  editorId = "editor-" + file.id + "-" + tabId;
  editorTab.append("<div class=\"editor\" id=\"" + editorId + "\"></div>");
  editor = ace.edit(editorId);
  if (defaultThemeIndex === 1) {
    editor.setTheme('ace/theme/crimson_editor');
  } else {
    editor.setTheme('ace/theme/twilight');
  }
  editor.setFontSize(defaultFontSize);
  editor.setValue(defaultValue);
  if ((ref = file.type) === 'verilog' || ref === 'exverilog' || ref === 'testbench') {
    editor.setOptions({
      enableSnippets: true,
      enableLiveAutocompletion: true,
      enableBasicAutocompletion: true,
      showPrintMargin: false
    }, blockScrolling = 2e308);
    editor.getSession().setMode('ace/mode/verilog');
  } else if (file.type === 'netlist') {
    editor.setOptions({
      enableSnippets: false,
      enableLiveAutocompletion: false,
      enableBasicAutocompletion: false,
      showPrintMargin: false,
      readOnly: true
    }, blockScrolling = 2e308);
    editor.getSession().setMode('ace/mode/verilog');
  } else {
    editor.setOptions({
      enableSnippets: false,
      enableLiveAutocompletion: false,
      enableBasicAutocompletion: false,
      showPrintMargin: false
    }, blockScrolling = 2e308);
  }
  editor.on('blur', function(e) {
    return hideEditorSnippet(editor);
  });
  editor.on('focus', function(e) {
    if (editor.reselect) {
      if ((file != null) && (file.id != null)) {
        selectNode(file.id);
      }
      return editor.reselect = false;
    } else {
      editor.reselect = true;
      return editor.focus();
    }
  });
  editor.on('change', function(e) {
    if (editorTab.data('saved')) {
      editorTab.data('saved', false);
      return setTabTitle(tabId, editorTab.data('title') + ' *');
    }
  });
  editor.commands.addCommand({
    name: 'saveOpenTab',
    bindKey: {
      win: 'Ctrl-S',
      mac: 'Command-S'
    },
    exec: (function(ed) {
      if (!ed.$readOnly) {
        return saveOpenTab();
      }
    }),
    readOnly: true
  });
  setTabTitle(tabId, file.text);
  editor.tab = editorTab;
  editorTab.data('title', file.text);
  editorTab.data('fileId', file.id);
  editorTab.data('editor', editor);
  editorTab.data('saved', true);
  editor.reselect = true;
  window.editor = editor;
  return editor;
};
attachWaveformViewer = function(tabId, file, wave) {
  var waveform, waveformDiv, waveformId, waveformTab;
  waveformTab = $("#" + tabId);
  waveformId = "waveform-" + file.id;
  waveformDiv = $("<div class=\"waveform\" id=\"" + waveformId + "\"></div>");
  waveformTab.append(waveformDiv);
  console.log('-------------------');
  console.log(wave);
  console.log(waveformId);
  waveform = new Waveform(waveformId, wave);
  waveform.setOnChangeListener(function(e) {});
  waveform.setOnSaveListener(function(timingDiagram) {});
  waveform.tab = waveformTab;
  setTabTitle(tabId, file.text);
  waveformTab.data('title', file.text);
  waveformTab.data('fileId', file.id);
  waveformTab.data('waveform', waveform);
  waveformTab.data('saved', true);
  return waveform;
};
createAceTab = function(fileNode, content) {
  var editor, id, tabId;
  if (content == null) {
    content = '';
  }
  id = "tabs-" + fileNode.id;
  if (getTabById(id)) {
    return setActiveEditorTabById(id);
  } else {
    tabId = addEditorTab(fileNode.text, fileNode.id);
    editor = attachEditor(tabId, fileNode, content);
    editor.clearSelection();
    editor.gotoLine(0);
    editor.focus();
    return editor;
  }
};
createWaveformTab = function(fileNode, content) {
  var id, tabId, waveform;
  id = "tabs-" + fileNode.id;
  if (getTabById(id)) {
    return setActiveEditorTabById(id);
  } else {
    tabId = addEditorTab(fileNode.text, fileNode.id);
    waveform = attachWaveformViewer(tabId, fileNode, content);
    return waveform;
  }
};
setActiveEditorTab = function(index) {
  return $('#editor-tabs').tabs({
    active: index
  });
};
setActiveEditorTabById = function(id) {
  var index;
  index = $("#editor-tabs a[href=\"#" + id + "\"]").parent().index() - 1;
  return setActiveEditorTab(index);
};
getEditorTabCount = function() {
  return $('#editor-tabs >ul >li').size();
};
activeTabExists = function() {
  return getEditorTabCount() > 0;
};
getActiveEditorTabIndex = function() {
  if (!activeTabExists()) {
    return null;
  } else {
    return $('#editor-tabs').tabs('option', 'active');
  }
};
getActiveEditorTabId = function() {
  return $("#editor-tabs .ui-tabs-panel:visible").attr('id');
};
getActiveEditor = function() {
  var editor, tabId;
  tabId = getActiveEditorTabId();
  if (tabId == null) {
    return null;
  }
  editor = $("#" + tabId).data('editor');
  return editor != null ? editor : false;
};
getActiveWaveform = function() {
  var tabId, waveform;
  tabId = getActiveEditorTabId();
  if (tabId == null) {
    return null;
  }
  waveform = $("#" + tabId).data('waveform');
  return waveform != null ? waveform : false;
};
getTabById = function(tabId) {
  var tab;
  tab = $("#" + tabId);
  if (!tab.length) {
    return false;
  } else {
    return tab;
  }
};
getAllTabs = function() {
  var tabDivs, tabIds;
  tabIds = [];
  tabDivs = $('.editor-tab-content');
  tabDivs.each(function(ind, tabDiv) {
    return tabIds.push($(tabDiv).attr('id'));
  });
  return tabIds;
};
saveAll = function(includeWaveforms, cb) {
  var dialogMessage, dialogTitle, notSavedTabs, tabs;
  if (typeof includeWaveforms === 'function') {
    cb = includeWaveforms;
    includeWaveforms = true;
  }
  tabs = getAllTabs();
  notSavedTabs = [];
  tabs.forEach(function(tabId) {
    var isSaved;
    isSaved = $("#" + tabId).data('saved');
    if ((isSaved != null) && !isSaved) {
      return notSavedTabs.push(tabId);
    }
  });
  if (notSavedTabs.length === 0) {
    return cb(null, false);
  } else {
    dialogTitle = "Save Open Tabs";
    dialogMessage = "<p>Do you want to save open tabs?</p>";
    confirmationDialog(dialogTitle, dialogMessage, function(accepted) {
      var savedTabs;
      if (accepted) {
        savedTabs = 0;
        return notSavedTabs.forEach(function(tabId, tabInd) {
          var editor, fileId, newContent, tab, waveform;
          tab = $("#" + tabId);
          fileId = tab.data('fileId');
          editor = tab.data('editor');
          waveform = tab.data('waveform');
          newContent = void 0;
          if (editor) {
            newContent = editor.getValue();
          } else if (waveform) {
            newContent = waveform.exportTimingDiagram();
          } else {
            savedTabs++;
            return console.warn('Cannot find the editor.');
          }
          return saveFile(fileId, newContent, function(err, fileId, fileName, fileType, newContent, modules) {
            var j, len, module, moduleId;
            if (!err) {
              savedTabs++;
              if (fileType === 'verilog' || fileType === 'exverilog') {
                deleteChildren(fileId);
                for (j = 0, len = modules.length; j < len; j++) {
                  module = modules[j];
                  moduleId = module + "_" + fileName + "_" + module + "_" + ((new Date).valueOf()) + "_" + (('' + Math.random()).split('.')[1]);
                  createNode(moduleId, fileId, module, 'module');
                }
              }
              tab.data('saved', true);
              setTabTitle(tabId, fileName);
            }
            if (savedTabs === notSavedTabs.length) {
              return cb(null, false);
            } else if (tabInd === notSavedTabs.length - 1) {
              return cb({
                error: 'Could not save all open tabs.'
              }, false);
            }
          });
        });
      } else {
        return cb(null, true);
      }
    });
    return null;
  }
};
hideEditorSnippet = function(editor) {
  if (editor != null) {
    if (editor.completer != null) {
      if (editor.completer.getPopup()) {
        return editor.completer.getPopup().hide();
      }
    }
  }
};
forceCloseTab = function(tabId, cb) {
  var linkTag, panelId, tab;
  tab = $("#" + tabId);
  if (tab.length) {
    linkTag = $(".editor-tab-link[href=\"#" + tabId + "\"]").parent();
    panelId = linkTag.remove().attr('aria-controls');
    $('#' + panelId).remove();
    $('#editor-tabs').tabs().tabs('refresh');
    if (typeof cb === 'function') {
      return cb();
    }
  }
};
closeTab = function(tabId, cb) {
  var _remove, dialogMessage, dialogTitle, editor, fileName, tab, waveform;
  tab = $("#" + tabId);
  editor = tab.data('editor');
  waveform = tab.data('waveform');
  _remove = function() {
    var linkTag, panelId;
    linkTag = $(".editor-tab-link[href=\"#" + tabId + "\"]").parent();
    panelId = linkTag.remove().attr('aria-controls');
    $('#' + panelId).remove();
    $('#editor-tabs').tabs().tabs('refresh');
    if (typeof cb === 'function') {
      return cb();
    }
  };
  hideEditorSnippet(editor);
  if ((editor != null) && !tab.data('saved')) {
    fileName = tab.data('title');
    dialogTitle = "Save " + fileName;
    dialogMessage = "<p>Do you want to save \"" + fileName + "\" before closing?</p>";
    promptDialog(dialogTitle, dialogMessage, function(accepted, cancelled) {
      var fileId, newContent;
      if (cancelled) {
        return;
      }
      if (accepted) {
        fileId = tab.data('fileId');
        newContent = editor.getValue();
        return saveFile(fileId, newContent, function(err, fileId, fileName, fileType, newContent, modules) {
          var j, len, module, moduleId;
          if (err) {
            return displayError(err);
          } else {
            if (fileType === 'verilog' || fileType === 'exverilog') {
              deleteChildren(fileId);
              for (j = 0, len = modules.length; j < len; j++) {
                module = modules[j];
                moduleId = module + "_" + fileName + "_" + module + "_" + ((new Date).valueOf()) + "_" + (('' + Math.random()).split('.')[1]);
                createNode(moduleId, fileId, module, 'module');
              }
            }
            tab.data('saved', true);
            setTabTitle(tabId, fileName);
            return _remove();
          }
        });
      } else {
        return _remove();
      }
    });
  } else if (waveform && !tab.data('saved')) {
    fileName = tab.data('title');
    dialogTitle = "Save " + fileName;
    dialogMessage = "<p>Do you want to save the timing diagram \"" + fileName + "\" before closing?</p>";
    promptDialog(dialogTitle, dialogMessage, function(accepted, cancelled) {
      var fileId, newContent;
      if (cancelled) {
        return;
      }
      if (accepted) {
        fileId = tab.data('fileId');
        newContent = waveform.exportTimingDiagram();
        return saveFile(fileId, newContent, function(err, fileId, fileName, fileType, newContent, modules) {
          if (err) {
            return displayError(err);
          } else {
            tab.data('saved', true);
            setTabTitle(tabId, fileName);
            return _remove();
          }
        });
      } else {
        return _remove();
      }
    });
  } else {
    _remove();
  }
  return tabId;
};
getActiveEditorTabContent = function() {
  var index;
  return index = getActiveTabIndex();
};
$('#btn-new-tab').button({
  text: false,
  icons: {
    primary: 'ui-icon-plusthick'
  }
}).click(function(e) {
  return $('#btn-new-tab').contextmenu('open', $('#btn-new-tab'));
});
$('#btn-new-tab').contextmenu({
  autoTrigger: false,
  menu: [
    {
      title: 'Verilog Module',
      cmd: 'newverilog'
    }, {
      title: 'Verilog Testbench',
      cmd: 'newtestbench'
    }
  ],
  close: function(event) {},
  beforeOpen: function(event, ui) {
    var topFolder;
    topFolder = getTopFolderNode();
    if (topFolder.type === 'buildFolder') {
      $('#btn-new-tab').contextmenu('enableEntry', 'newverilog', false);
      return $('#btn-new-tab').contextmenu('enableEntry', 'newtestbench', false);
    } else {
      $('#btn-new-tab').contextmenu('enableEntry', 'newverilog', true);
      return $('#btn-new-tab').contextmenu('enableEntry', 'newtestbench', true);
    }
  },
  select: function(event, ui) {
    switch (ui.cmd) {
      case 'newverilog':
        return newVerilog();
      case 'newtestbench':
        return newTestbench();
    }
  }
});
getProjectTree = function(filter, cb) {
  if (filter == null) {
    filter = '';
  }
  if (typeof filter === 'function') {
    cb = filter;
    filter = '';
  }
  filter = filter.trim();
  if (filter === 'verilog') {
    return cb(null, filesTree.filter(function(file) {
      return file.type === 'verilog';
    }), buildFolderId);
  } else if (filter === 'netlist') {
    return cb(null, filesTree.filter(function(file) {
      return file.type === 'netlist';
    }), buildFolderId);
  } else {
    return cb(null, filesTree, buildFolderId);
  }
};
getProjectSettings = function(cb) {
  var defaultSettings;
  defaultSettings = {
    theme: 0,
    fontSize: 15
  };
  return cb(null, defaultSettings);
};
getVerilogFiles = function(cb) {
  return getProjectTree('verilog', cb);
};
getNetlistFiles = function(cb) {
  return getProjectTree('netlist', cb);
};
getStandardCells = function(cb) {
  request(Urls.stdcell, 'GET', {}, (function(res) {
    var cell, cells, j, len, ref;
    cells = [];
    ref = res.stdcell;
    for (j = 0, len = ref.length; j < len; j++) {
      cell = ref[j];
      cells.push({
        id: cell,
        text: cell
      });
    }
    return cb(null, cells);
  }), function(error) {
    return cb(error, []);
  });
  return null;
};
resizeHanlder = (function(_this) {
  return function(e) {
    var threhWidth;
    threhWidth = toolbar.width() + menubar.width() + 50;
    if (window.innerWidth < threhWidth) {
      return toolbar.hide();
    } else {
      return toolbar.show();
    }
  };
})(this);
refreshTree = function(isContext) {
  if (isContext == null) {
    isContext = false;
  }
  loadingOn();
  return getProjectTree(function(err, files, buildDir) {
    loadingOff();
    if (err) {
      return displayError(err.error);
    } else {
      return setTreeData(files);
    }
  });
};
setupIDE = function() {
  var rootFolderId, srcFolderId;
  getProjectSettings(function(err, settings) {
    if (err) {
      return displayError(err);
    } else {
      defaultThemeIndex = settings.theme;
      return defaultFontSize = settings.fontSize;
    }
  });
  buildFolderId = generateId('buildFolder');
  rootFolderId = generateId('root');
  srcFolderId = generateId('folder');
  addToFileTree(rootFolderId, '#', 'CloudV', 'root');
  addToFileTree(buildFolderId, rootFolderId, 'build (read-only)', 'buildFolder');
  addToFileTree(srcFolderId, rootFolderId, 'src', 'folder');
  refreshTree();
  addTreeContextMenu();
  openNode(rootFolderId);
  $(window).resize(resizeHanlder);
  resizeHanlder();
  $(document).unbind('keydown').bind('keydown', function(e) {
    var doPrevent, el, tagName, type;
    doPrevent = false;
    if (e.keyCode === 8) {
      el = e.srcElement || e.target;
      tagName = el.tagName.toLowerCase();
      type = eltype.toLowerCase();
      if (tagName === 'input' && (type === 'text' || type === 'password' || type === 'file' || type === 'search' || type === 'email' || type === 'number' || type === 'date') || tagName === 'textarea') {
        doPrevent = el.readOnly || el.disabled;
      } else {
        doPrevent = false;
      }
    }
    if (doPrevent) {
      return e.preventDefault();
    }
  });
  return $('.ui-tabs').click(function(e) {
    var editor;
    if (!$(e.target).is('a')) {
      editor = getActiveEditor();
      if (editor) {
        editor.reselect = true;
        return editor.focus();
      }
    }
  });
};


setupIDE();
var viewer;
var scene;
var XZPolygon = [];
var enterpriseEntities = {
	"名山区": [],
	"雨城区": [],
	"荥经县": [],
	"汉源县": [],
	"石棉县": [],
	"天全县": [],
	"芦山县": [],
	"宝兴县": [],
	"金牛区": [],
	"青羊区": [],
	"武侯区": [],
	"成华区": [],
	"锦江区": [],
	"龙泉驿区": [],
	"温江区": [],
	"新都区": [],
	"郫都区": [],
	"双流区": [],
	"青白江区": [],
	"蒲江县": [],
	"大邑县": [],
	"金堂县": [],
	"新津县": [],
	"简阳市": [],
	"都江堰市": [],
	"彭州市": [],
	"崇州市": [],
	"邛崃市": []
}
var leftClick_handler;
var movePick_handler;
var sceneBubble;
var pop;

var parkTypePoints = [];
var selected;
var highlighted;

function onload(Cesium) {
	//初始化viewer部件
	viewer = new Cesium.Viewer('cesiumContainer', {
		//		sceneMode: Cesium.SceneMode.SCENE2D,
		infoBox: false,
		sceneModePicker: false,
		navigation: false
	});
	scene = viewer.scene;
	sceneBubble = new Bubble(scene);
	pop = new pop();
	leftClick_handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
	MovePiceACtion();
	queryattributesClick(true);

	var imageryLayers = viewer.imageryLayers;
	var VECimageryProvider = new Cesium.TiandituImageryProvider({
		mapStyle: Cesium.TiandituMapsStyle.VEC_C,
		credit: new Cesium.Credit('天地图全球影像服务     数据来源：国家地理信息公共服务平台 & 四川省测绘地理信息局')
	})
	imageryLayers.addImageryProvider(VECimageryProvider);
	//初始化天地图全球中文注记服务，并添加至影像图层
	var labelImagery = new Cesium.TiandituImageryProvider({
		mapStyle: Cesium.TiandituMapsStyle.CIA_C //天地图全球中文注记服务（经纬度投影）
	});

	imageryLayers.addImageryProvider(labelImagery);

	addCBDdata(parkscenedata.url);
	addboundaries();
	addenterpriseBilboard();
	addParkTypedata(parkTypedata);
	buildTree('layerTree', treedata, parkdata);
	$('#loadingbar').remove();
	var SCentity = viewer.entities.getById('四川省');
	if(SCentity !== undefined) {
		SCentity.show = true;
		viewer.flyTo(SCentity, {
			duration: 3
		})

	}
	// Information about the currently selected feature
	selected = {
		feature: undefined,
		originalColor: new Cesium.Color()
	};

	// Information about the currently highlighted feature
	highlighted = {
		feature: undefined,
		originalColor: new Cesium.Color()
	};

}
//addCBD，默认隐藏
var addCBDdata = function(url) {
	var openPromise = scene.open(url);
	openPromise.then(function(layers) {
		layers.forEach(function(layer) {
			layer.visible = false;
		})
		viewer.camera.setView({
			destination: new Cesium.Cartesian3(6788287.844465209, -41980756.10214644, 29619220.04004376)
		});
	})
}
//添加行政边界界线
var addboundaries = function() {
	dataBounds.forEach(function(bound) {
		var entity = viewer.entities.add({
			id: bound.name,
			name: bound.name,
			position: Cesium.Cartesian3.fromDegrees(bound.coordinates[0], bound.coordinates[1], 3000),
			polygon: {
				hierarchy: Cesium.Cartesian3.fromDegreesArray(bound.points),
				extrudedHeight: 3000.0,
				material: Cesium.Color.CYAN.withAlpha(0.5),
				outline: true,
				outlineColor: Cesium.Color.NAVY,
				closeBottom: false
			},
			label: {
				text: bound.name,
				font: '20px Helvetica',
				fillColor: Cesium.Color.SNOW,
				outlineColor: Cesium.Color.BLACK,
				outlineWidth: 2,
				pixelOffset: new Cesium.Cartesian2(0, -30),
				scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.5, 1.5e7, 0.5),
				style: Cesium.LabelStyle.FILL_AND_OUTLINE
			},
			show: false
		});
		XZPolygon.push(entity)
	})
}
//添加树状结构
var buildTree = function(a, b, c) { //a传入containerDOMID，基于bootstrap创建,b为nodedata
	var parks = c.features;
	var QXnodes = b[0].nodes;

	parks.forEach(function(feature) {
		var inValue = feature.properties['行政区名称'];
		var parkname = feature.properties['园区名称'];
		for(var i = 0, len = QXnodes.length; i < len; i++) {
			QXnodes[i].nodes.forEach(function(node) {
				if(node.text === inValue) {
					if(node.nodes === undefined) {
						node['nodes'] = [];
					}
					var inputnode = {
						text: parkname,
						state: {
							checked: true,
							selectable: false
						}
					}
					node.nodes.push(inputnode)
				}
			})
		}

	})
	b[0].nodes = QXnodes;

	var nameStr = "#" + a;
	$(nameStr).empty();
	var layetreediv = $('<div></div>'); //创建一个子div
	layetreediv.attr('id', 'layerTree'); //给子div设置id
	layetreediv.addClass('treeview'); //添加css样式

	$(nameStr).append(layetreediv);

	if(b) {
		$('#layerTree').treeview({
			data: b,
			checkedIcon: "glyphicon glyphicon-check",
			nodeIcon: "glyphicon glyphicon-map-marker",
			showIcon: true,
			backColor: "#071D32",
			color: "#fff",
			selectedColor: "#21F2F3",

			onhoverColor: "#07A3EE",
			//showBorder:false,
			multiSelect: false,
			showCheckbox: false,
			levels: 3,

			onNodeSelected: function(event, node) //节点选中事件
			{
				var nodetext = node.text;
				addeacharts(nodetext);

				var nodeEntity = viewer.entities.getById(nodetext);
				if(nodeEntity !== undefined) {

					sceneBubble.container.hide();
					pop.container.hide();
					newlocationTo(false);

					XZPolygon.forEach(function(entity) {
						entity.show = false;

					})
					nodeEntity.show = true;
					viewer.flyTo(nodeEntity, {
						duration: 2
					})
					for(var key in enterpriseEntities) {
						if(enterpriseEntities[key].length > 0) {
							enterpriseEntities[key].forEach(function(entity) {
								entity.show = false;
							})
						}
					}
					enterpriseEntities[nodetext] !== undefined ? (
						enterpriseEntities[nodetext].forEach(function(entity) {
							entity.show = true;
						})
						//updataInfoPanel(enterpriseEntities[nodetext], nodetext)
					) : false

				} else { //园区选择，两个操作，定位到园区，同时弹出全书属性表
					sceneBubble.container.hide();
					for(var key in enterpriseEntities) {
						if(enterpriseEntities[key].length > 0) {
							enterpriseEntities[key].forEach(function(entity) {
								entity.show = false;
							})
						}
					}

					parks.forEach(function(feature) {
						var parkname = feature.properties['园区名称'];
						var parkproperties = feature.properties;
						if(nodetext === parkname) {
							var parkinfo = {
								name: [],
								value: []
							}
							for(var key in parkproperties) {
								parkinfo.name.push(key);
								parkinfo.value.push(parkproperties[key]);
							}

							pop.container.change({
								title: '园区信息',
								contentTable: {
									name: parkinfo.name,
									value: parkinfo.value
								}
							});
							pop.container.show();
						}

					})
					newlocationTo(true);
				}

			}

		});

	}

}
//弹出echarts
var addeacharts = function(a) {
	var dom = document.getElementById("echartsContainer");
	//dom.style.display = 'block';
	document.getElementById("echartsinfo").style.display = 'block';

	echarts.dispose(dom);
	var myChart = echarts.init(dom);
	var app = {};
	option = null;
	option = {
		title: {
			text: a,
			//			subtext: '纯属虚构',
			x: 'center',
			textStyle: {
				color: '#fff'
			}
		},
		tooltip: {
			trigger: 'item',
			formatter: "{a} <br/>{b} : {c} ({d}%)"
		},
		backgroundColor: 'rgba(7, 29, 50, 0.8)',
		legend: {
			x: 'center',
			y: 'bottom',
			data: ['土地状况', '重点企业', '重点项目', '经济数据', '产业分布'],
			textStyle: {
				color: '#fff'
			}
		},
		toolbox: {
			show: true,
			feature: {
				mark: {
					show: true
				},
				dataView: {
					show: false,
					readOnly: false
				},
				magicType: {
					show: true,
					type: ['pie']
				},
				restore: {
					show: false
				},
				saveAsImage: {
					show: false
				}
			}
		},
		calculable: true,
		series: [{
			name: '统计数据',
			type: 'pie',
			radius: [30, 110],
			center: ['50%', '50%'],
			roseType: 'area',
			data: [{
					value: 10,
					name: '土地状况'
				},
				{
					value: 5,
					name: '重点企业'
				},
				{
					value: 15,
					name: '重点项目'
				},
				{
					value: 25,
					name: '经济数据'
				},
				{
					value: 20,
					name: '产业分布'
				}
			]
		}]
	};
	if(option && typeof option === "object") {
		myChart.setOption(option, true);
	}
}
//添加区域企业分布点位
var addenterpriseBilboard = function() {
	var data = biiboarddata.features;
	data.forEach(function(pointObj) {
		var locationValue = pointObj.properties["行政区"];
		var position = pointObj.geometry.coordinates;
		position.push(5000);

		var Entity = viewer.entities.add({
			position: Cesium.Cartesian3.fromDegrees(position[0], position[1], position[2]),
			billboard: {
				image: './images/location4.png', // default: undefined
				pixelOffset: new Cesium.Cartesian2(0, -30),
				scale: 0.35,
				color: Cesium.Color.WHITE
			},
			show: false
		});
		enterpriseEntities[locationValue].push(Entity);

	})

}
//var updataInfoPanel = function(a, b) {
//	if(a.length > 0) {
//		var updatainnerHtml = "";
//		for(var i = 0, len = a.length; i < len; i++) {
//			updatainnerHtml += '<a href="#" class="list-group-item"><span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span>' + b + ':' + i + '</a>'
//		}
//
//		$("#queryResultslist").html(updatainnerHtml);
//		$('#queryResults').show();
//
//		$('.list-group-item').click(function() {
//			sceneBubble.container.hide();
//			var listValue = $(this).text();
//			viewer.entities.values.forEach(function(entity) {
//				entity.show = false;
//			})
//			locationTo(listValue);
//		})
//	}
//}
//点击区域企业列表，进入具体的企业,传入具体企业编号或者名字
//var locationTo = function(a) {
//	//暂未实现根据参数进行添加，当前固定
//	scene.layers.removeAll();
//	var addPromise = scene.addS3MTilesLayerByScp('http://localhost:8090/iserver/services/3D-dataCD/rest/realspace/datas/dtm/config', {
//		name: 'dtm@DTM'
//	});
//
//	addPromise.then(function(layer) {
//		viewer.flyTo(layer);
//	})
//
//}

var newlocationTo = function(a) {
	if(a === true) {
		viewer.scene.layers._layers._array.forEach(function(layer) {
			layer.visible = true;
		})
		viewer.camera.flyTo({
			destination: new Cesium.Cartesian3(parkscenedata.cameraobj.x, parkscenedata.cameraobj.y, parkscenedata.cameraobj.z),
			orientation: {
				heading: parkscenedata.cameraobj.heading,
				pitch: parkscenedata.cameraobj.pitch,
				roll: parkscenedata.cameraobj.roll
			}
		})
	} else {
		viewer.scene.layers._layers._array.forEach(function(layer) {
			layer.visible = false;
		})
	}
}
//属性查询操作
var queryattributesClick = function(value) {

	var inputfn = leftClick_handler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
	if(inputfn !== undefined) {
		leftClick_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
	}
	if(value === true) {
		leftClick_handler.setInputAction(function(e) {

			var position = scene.pickPosition(e.position);

			var selection3D = getSelection();
			if(selection3D !== undefined) {
				sceneBubble.showAt(position);
				sceneBubble.container.change({
					title: '企业信息',
					contentTable: {
						name: enterpriseinfo.title,
						value: enterpriseinfo.value
					}
				})
				//getFeatureBysql(selection3D, position)

			} else {
				sceneBubble.container.hide();
			}

		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

	} else {
		sceneBubble.container.hide();

		var inputfn = leftClick_handler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
		if(inputfn !== undefined) {
			leftClick_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
		}

	}

}

//点击sql查询
function getFeatureBysql(selection, position) {
	//暂时只指定固定的一个数据，后期根据数据进行判断
	var dataInfo = selection.layer._name.split('@')
	var dataSetName = dataInfo[0]
	var dataSourceName = dataInfo[1]

	var queryObj = {
		"getFeatureMode": "ID",
		"datasetNames": ["DTM" + ":" + "dtm"],
		"ids": [selection.ID]
	};

	var queryObjJson = JSON.stringify(queryObj);
	//	var dataUrl = dataConfig.dataServers.url;
	var dataUrl = 'http://localhost:8090/iserver/services/data-dataCD/rest/data/featureResults.rjson?returnContent=true'

	$.ajax({
		type: "post",
		url: dataUrl,
		data: queryObjJson,
		success: function(result) {
			var resultobj = JSON.parse(result);

			var backfeature = resultobj.features[0];

			sceneBubble.showAt(position);
			sceneBubble.container.change({
				contentTable: {
					name: backfeature.fieldNames,
					value: backfeature.fieldValues
				}
			})
			sceneBubble.selection3D = selection;

		},
		error: function(msg) {
			console.log(msg);
		}
	})

}
//返回选中对象
var getSelection = function() {
	var layers = scene.layers._layers.values;
	var layerCount = layers.length;
	if(layerCount > 0) {
		for(var i = 0; i < layerCount; i++) {
			var ids = layers[i].getSelection();
			if(ids[0] !== undefined) {
				var Selection3D = {};
				Selection3D["layer"] = layers[i];
				Selection3D["ID"] = ids[0];
				return Selection3D;
			}
		}
		return undefined;
	} else {
		return undefined;
	}
};

//关闭区域企业面板
var closeResultPanel = function(a) {
	$(a).hide();
}
//园区行政级别点
var addParkTypedata = function(data) {
	if(typeof data === 'object') {
		var features = data.features;
		features.forEach(function(feature) {
			var featureparkType = feature.properties["园区类型"];
			featureparkType === "国家级" ? (addParkTypepoint(feature, featureparkType, Cesium.Color.RED, 15)) : (featureparkType === "省级" ? (addParkTypepoint(feature, featureparkType, Cesium.Color.BLUE, 10)) : (featureparkType === "市级" ? (addParkTypepoint(feature, featureparkType, Cesium.Color.GREEN, 5)) : false))
		})
	}
}
var addParkTypepoint = function(feature, type, color, pixelSize) {
	var points = feature.geometry.coordinates;
	var point = viewer.entities.add({
		name: type,
		position: Cesium.Cartesian3.fromDegrees(points[0], points[1], 3000 + 1000),
		point: {
			color: color, // default: WHITE
			pixelSize: pixelSize, // default: 1
			outlineColor: Cesium.Color.YELLOW, // default: BLACK
			outlineWidth: 3, // default: 0
			distanceDisplayCondition: new Cesium.DistanceDisplayCondition(250000, 4000000)
		},
		show: true,
		description: type
	});
	parkTypePoints.push(point);
}
var ParkTypepointVisible = function(type) {
	if(type !== undefined) {
		parkTypePoints.forEach(function(entity) {
			entity.description._value === type ? (entity.show === true ? (entity.show = false) : (entity.show = true)) : false
		})
	}
}
/****园区级别点操作结束*****/
/*扩展实现移动鼠标高亮对象，兼容实体和s3m图层*/
var MovePiceACtion = function() {
	this.handler = viewer.screenSpaceEventHandler;
	var nameOverlay = document.createElement('div');
	this.infoContainner = nameOverlay;
	viewer.container.appendChild(this.infoContainner);
	this.infoContainner.className = 'backdrop';
	this.infoContainner.style.display = 'none';
	this.infoContainner.style.position = 'absolute';
	this.infoContainner.style.bottom = '0';
	this.infoContainner.style.left = '0';
	this.infoContainner.style['pointer-events'] = 'none';
	this.infoContainner.style.padding = '4px';
	this.infoContainner.style.backgroundColor = 'black';
	this.infoContainner.style.color = '#fff';
	this.lastPickedEntity;
	this.lastPickedColor;
	this.pickedColor = Cesium.Color.BLUE.withAlpha(0.7);

	this.handler.setInputAction(function onMouseMove(movement) {
		//选中高亮对象
		var pickEntity = viewer.scene.pick(movement.startPosition);
		//var pickEntity = viewer.scene.pick(movement.endPosition);
		var s3mlayerPick = getSelection();

		if(Cesium.defined(this.lastPickedEntity)) {
			var propertyNames = this.lastPickedEntity.id._propertyNames;
			propertyNames.forEach(function(typeValue) {
				if(this.lastPickedEntity.id[typeValue] !== undefined) {
					if(this.lastPickedEntity.id[typeValue].material !== undefined) {
						this.lastPickedEntity.id[typeValue].material.color = this.lastPickedEntity.id[typeValue]['originalColor'];
					}
					if(this.lastPickedEntity.id[typeValue].color !== undefined) {

						this.lastPickedEntity.id[typeValue].color = this.lastPickedEntity.id[typeValue]['originalColor'];
					}
					if(this.lastPickedEntity.id[typeValue].fillColor !== undefined) {

						this.lastPickedEntity.id[typeValue].fillColor = this.lastPickedEntity.id[typeValue]['originalColor'];
					}
				}

			})
			this.lastPickedEntity = undefined;

		}

		if(pickEntity !== undefined) {
			this.lastPickedEntity = pickEntity;
			var propertyNames = pickEntity.id._propertyNames;
			propertyNames.forEach(function(typeValue) {
				if(pickEntity.id[typeValue] !== undefined) {
					if(pickEntity.id[typeValue].material !== undefined) {
						if(pickEntity.id[typeValue].originalColor === undefined) {
							pickEntity.id[typeValue]['originalColor'] = {};
							Cesium.Color.clone(pickEntity.id[typeValue].material.color._value, pickEntity.id[typeValue]['originalColor']);
						}
						pickEntity.id[typeValue].material.color = this.pickedColor;
					}
					if(pickEntity.id[typeValue].color !== undefined) {
						if(pickEntity.id[typeValue].originalColor === undefined) {
							pickEntity.id[typeValue]['originalColor'] = {};
							Cesium.Color.clone(pickEntity.id[typeValue].color._value, pickEntity.id[typeValue]['originalColor']);
						}
						pickEntity.id[typeValue].color = this.pickedColor;
					}
					if(pickEntity.id[typeValue].fillColor !== undefined) {

						if(pickEntity.id[typeValue].originalColor === undefined) {
							pickEntity.id[typeValue]['originalColor'] = {};
							Cesium.Color.clone(pickEntity.id[typeValue].fillColor._value, pickEntity.id[typeValue]['originalColor']);
						}
						pickEntity.id[typeValue].fillColor = this.pickedColor;
					}
				}
			})
			this.infoContainner.style.display = 'block';
			this.infoContainner.style.bottom = viewer.canvas.clientHeight - movement.endPosition.y + 'px';
			this.infoContainner.style.left = movement.endPosition.x + 'px';
			this.infoContainner.textContent = Cesium.defined(pickEntity.id.name) ? pickEntity.id.name : pickEntity.id.id;
			return;
		} else if(s3mlayerPick !== undefined) {
			s3mlayerPick.layer.selectColorType = 1;
			s3mlayerPick.layer.selectedColor = this.pickedColor;

			this.infoContainner.style.display = 'block';
			this.infoContainner.style.bottom = viewer.canvas.clientHeight - movement.endPosition.y + 'px';
			this.infoContainner.style.left = movement.endPosition.x + 'px';
			this.infoContainner.textContent = s3mlayerPick.layer._name + ':' + s3mlayerPick.ID;
			return;
		} else {
			this.infoContainner.style.display = 'none'
		}

	}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}
/*扩展实现移动鼠标高亮对象结束*/
<xsl:stylesheet 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="xs"
    version="2.0">

<xsl:param name="dir" required="yes" as="xs:string"/>

<xsl:output name="javascript" method="text" indent="no"/>
<xsl:output name="json" method="text"/>

<xsl:template match="/">
	
	<xsl:call-template name="nodeApp"/>
	<xsl:call-template name="nodeServices"/>
	<xsl:apply-templates select="firebaseListener/config"/>
	
</xsl:template>
	
<xsl:template name="nodeApp">
	<xsl:result-document href="{$dir}/app.js" format="javascript">
		<xsl:text disable-output-escaping="yes">
'use strict';

var config = require('./config.json');
var Firebase = require('firebase');

var ModelListener = require('./model-listener');
var LiferayServices = require('./services');

var ref = new Firebase(config.firebase.url);
</xsl:text>
		<xsl:for-each select="firebaseListener/modelListeners/model" >
			<xsl:call-template name="nodeAppEntities"/>
		</xsl:for-each>
		<xsl:text>
function restartListeners(timestamp) {
</xsl:text>
		<xsl:for-each select="//model">
			<xsl:if test="not(position() = 1)">
				<xsl:text>.then(() => {
</xsl:text>
				<xsl:text>		return </xsl:text>
			</xsl:if>
			<xsl:if test="position() = 1">
				<xsl:text>	</xsl:text>
			</xsl:if>
			<xsl:value-of select="concat(@id, 'Listener.restart(timestamp)')"/>
			<xsl:if test="not(position() = 1)">
				<xsl:text>;
	})</xsl:text>
			</xsl:if>
			<xsl:if test="position() = last()">
				<xsl:text>.then(() => {
		ref.child('_RESTART').set(0);
	});</xsl:text>
			</xsl:if>
		</xsl:for-each>
		<xsl:text>
}

ref.child('_RESTART').set(-1);

ref.child('_RESTART').on('value', (snapshot) => {
    var restart = snapshot.val();
    if (restart == 0) {
        //Do nothing
    } else if (restart == -1) {
        ref.child('_TIMESTAMP').once('value').then((snapshot) => {
            var timestamp = snapshot.val();
            if (!timestamp) timestamp = 0;
            restartListeners(timestamp);
         }).catch((error) => {
            console.error("%s", error);
        });
    } else {
         restartListeners(restart);
    }
});

</xsl:text>
	</xsl:result-document>
</xsl:template>
	
<xsl:template name="nodeAppEntities">
<xsl:variable name="entityName" select="@id"/>
<xsl:variable name="entityTree" select="source"/>
<xsl:variable name="modelVar" select="concat($entityName, 'Model')" />
<xsl:variable name="refVar" select="concat($entityName, 'Ref')"/>
<xsl:variable name="listenerVar" select="concat($entityName, 'Listener')"/>
<xsl:text>var </xsl:text>
<xsl:value-of select="$refVar"/>
<xsl:text>= ref.child("</xsl:text>
<xsl:value-of select="$entityTree"/>
<xsl:text>");
</xsl:text>
<xsl:text>var </xsl:text>
<xsl:value-of select="$modelVar"/>
<xsl:text> = { 
</xsl:text>
<xsl:call-template name="nodeAppModel" />
<xsl:text>	"relations" : { 
</xsl:text>
<xsl:for-each select="relations/relation">
	<xsl:call-template name="nodeAppRelation" />
</xsl:for-each>
<xsl:text>	}
};
</xsl:text>

<xsl:text>var </xsl:text>
<xsl:value-of select="$listenerVar"/>
<xsl:text>= new ModelListener(</xsl:text>
<xsl:value-of select="concat($modelVar, ', ', $refVar, ', ')"/> 
<xsl:text>LiferayServices.</xsl:text>
<xsl:value-of select="concat($entityName, 'WS')"/>
<xsl:text>);
	
</xsl:text>
</xsl:template>

<xsl:template name="nodeAppRelation">
<xsl:variable name="relId" select="@idref"/>
<xsl:variable name="relModel" select="//model[@id=($relId)]"/>
<xsl:text>		"</xsl:text>
<xsl:value-of select="$relModel/source"/>
<xsl:text>" : {
			"type" : "</xsl:text>
<xsl:value-of select="@type"/>
<xsl:text>",
			"refField" : "</xsl:text>
<xsl:value-of select="."/>
<xsl:text>",
			"lrId" : "</xsl:text>
<xsl:value-of select="$relModel/mapping/field[@primary-key]/target"/>
<xsl:text>",
			"fbId" : "</xsl:text>
<xsl:value-of select="$relModel/mapping/field[@primary-key]/source"/>
<xsl:text>"
		}</xsl:text>
<xsl:if test="not(position() = last())">
	<xsl:text>, </xsl:text>
</xsl:if>
<xsl:text>
</xsl:text>
</xsl:template>

<xsl:template name="nodeAppModel">
<xsl:variable name="entityName" select="@id"/>
<xsl:variable name="lrPK" select="mapping/field[@primary-key]/target"/>
<xsl:variable name="fbPK" select="mapping/field[@primary-key]/source"/>
<xsl:text>	"name" : "</xsl:text>
<xsl:value-of select="$entityName"/>
<xsl:text>",
</xsl:text>
<xsl:text>	"lrId" : "</xsl:text>
<xsl:value-of select="$lrPK"/>
<xsl:text>",
</xsl:text>
<xsl:text>	"fbId" : "</xsl:text>
<xsl:value-of select="$fbPK"/>
<xsl:text>",
</xsl:text>
</xsl:template>

<xsl:template name="nodeServices">
	<xsl:result-document href="{$dir}/services.js" format="javascript">
		<xsl:text>'use strict';
var LiferayService = require('./liferay-service.js');</xsl:text>
		<xsl:for-each select="//model">
			<xsl:call-template name="nodeServicesEntity"/>
		</xsl:for-each>
	</xsl:result-document>
</xsl:template>
	
<xsl:template name="nodeServicesEntity">
	<xsl:variable name="entityName" select="@id"/>
	<xsl:variable name="serviceName" select="concat($entityName, 'WS')"/>
	<xsl:text>

var </xsl:text>
	<xsl:value-of select="$serviceName"/>
	<xsl:text> = new LiferayService('</xsl:text>
	<xsl:value-of select="target/@baseURL"/>
	<xsl:text>');
</xsl:text>
	<xsl:for-each select="target/service">
		<xsl:variable name="method" select="@method"/>
		<xsl:value-of select="concat($serviceName, '.', $method, 'Method')"/>
		<xsl:text> = '</xsl:text>
		<xsl:value-of select="@name"/>
		<xsl:text>';
</xsl:text>
		<xsl:value-of select="concat($serviceName, '.', $method, 'Params')"/>
		<xsl:text> = function(</xsl:text>
		<xsl:value-of select="$entityName"/>
		<xsl:text>) {
	return {
		</xsl:text>
		<xsl:for-each select="arg">
			<xsl:value-of select="concat('&quot;', @param, '&quot; : ')"/>
			<xsl:if test="not(@const)">
				<xsl:value-of select="concat($entityName, '.')"/>
			</xsl:if>
			<xsl:value-of select="."/>
			<xsl:if test="not(position() = last())">
				<xsl:text>,
		</xsl:text>
			</xsl:if>
			
		</xsl:for-each>
		<xsl:text>
	};
};
</xsl:text>
	</xsl:for-each>
<xsl:value-of select="concat('exports.', $serviceName, ' = ', $serviceName, ';')"/>
	<xsl:text>
</xsl:text>
</xsl:template>

<xsl:template match="/firebaseListener/config">
	<xsl:result-document href="{$dir}/config.json" format="json">
{
	"firebase" : {
		"url" : "<xsl:value-of select="firebase/url"/>"
	},
	"liferay" : {
		"hostname" : "<xsl:value-of select="liferay/host"/>",
		"port" : "<xsl:value-of select="liferay/port"/>",
		"auth" : "<xsl:value-of select="liferay/auth"/>"
	}
}
	</xsl:result-document>
</xsl:template>
</xsl:stylesheet>


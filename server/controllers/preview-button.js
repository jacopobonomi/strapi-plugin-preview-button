'use strict';

const { getService, pluginId } = require( '../utils' );

module.exports = {
  async config( ctx ) {
    const { contentTypes } = await getService( 'preview-button' ).getConfig();

    const config = {
      contentTypes: contentTypes.map( type => type.uid ),
    };

    ctx.send( { config } );
  },

  async findOne( ctx ) {
    const { uid, id } = ctx.request.params;

    const hasEnvVars = [
      process.env.STRAPI_PREVIEW_SECRET,
      process.env.STRAPI_PREVIEW_DRAFT_URL,
      process.env.STRAPI_PREVIEW_PUBLISHED_URL,
    ].every( val => val );

    const pluginService = await getService( 'preview-button' );
    const { contentTypes } = await pluginService.getConfig();
    const supportedType = contentTypes.find( type => type.uid === uid );
    // Fetch only entity if id of Collection is undefined.
    const entity = id != undefined ?
      await strapi.query( uid ).findOne({}) :
      await strapi.query( uid ).findOne({
        where: { id },
      } );

    // Raise warning if plugin is active but not properly configured with required env vars.
    if ( ! hasEnvVars ) {
      console.warn( `Environment variables required for ${pluginId} plugin must be defined before it can be used.` );
    }

    // Return empty object if requirements are not met.
    if ( ! hasEnvVars || ! supportedType || ! entity ) {
      return ctx.send( {} );
    }

    const urls = pluginService.getPreviewUrls( entity, supportedType );

    // Return preview URLs.
    ctx.send( { urls } );
  },
};

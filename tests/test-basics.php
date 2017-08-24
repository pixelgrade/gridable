<?php
/**
 * Class SampleTest
 *
 * @package Gridable
 */

/**
 * Basics test case.
 */
class BasicsTest extends WP_UnitTestCase {

	public function tearDown() {
		parent::tearDown();
		unset( $GLOBALS['current_screen'] );
	}

	/**
	 * A single example test.
	 */
	function test_if_exists() {
		// Replace this with some actual testing code.
		$this->assertTrue( function_exists( 'activate_gridable' ) );
	}

	function test_admin_assets_exists() {

		set_current_screen( 'edit.php' );

		$this->assertTrue( is_admin() );

		$this->assertFalse( wp_script_is( 'jquery' ) );
		ob_start();
		do_action( 'media_buttons' );
		ob_get_clean();

		// make sure you have the scripts
		 $this->assertTrue( wp_script_is( 'gridable-add-row-button' ) );
	}
}

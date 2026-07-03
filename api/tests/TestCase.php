<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * RefreshDatabase sonrası DatabaseSeeder (cities) otomatik koşsun.
     */
    protected $seed = true;
}
